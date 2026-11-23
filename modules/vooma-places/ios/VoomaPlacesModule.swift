import ExpoModulesCore
import MapKit

private final class CompletionSearch: NSObject, MKLocalSearchCompleterDelegate {
  let completer = MKLocalSearchCompleter()
  var finish: ((Result<[MKLocalSearchCompletion], Error>) -> Void)?

  init(query: String, latitude: Double?, longitude: Double?, finish: @escaping (Result<[MKLocalSearchCompletion], Error>) -> Void) {
    self.finish = finish
    super.init()
    completer.delegate = self
    completer.resultTypes = [.address, .pointOfInterest]
    if let latitude, let longitude {
      completer.region = MKCoordinateRegion(center: CLLocationCoordinate2D(latitude: latitude, longitude: longitude), latitudinalMeters: 100000, longitudinalMeters: 100000)
    }
    completer.queryFragment = query
  }

  func completerDidUpdateResults(_ completer: MKLocalSearchCompleter) {
    finish?(.success(completer.results))
    finish = nil
  }

  func completer(_ completer: MKLocalSearchCompleter, didFailWithError error: Error) {
    finish?(.failure(error))
    finish = nil
  }

  func cancel() {
    completer.delegate = nil
    completer.cancel()
    finish?(.failure(NSError(domain: "VoomaPlaces", code: -999)))
    finish = nil
  }
}

public final class VoomaPlacesModule: Module {
  private var completionSearch: CompletionSearch?
  private var completions: [String: MKLocalSearchCompletion] = [:]
  private var sessionId: String?
  private var localSearch: MKLocalSearch?

  public func definition() -> ModuleDefinition {
    Name("VoomaPlaces")

    AsyncFunction("search") { (query: String, latitude: Double?, longitude: Double?, session: String, promise: Promise) in
      self.completionSearch?.cancel()
      self.completions.removeAll()
      self.sessionId = session
      self.completionSearch = CompletionSearch(query: String(query.prefix(200)), latitude: latitude, longitude: longitude) { result in
        switch result {
        case .success(let matches):
          let results: [[String: String]] = matches.prefix(8).map { match in
            let id = UUID().uuidString
            self.completions[id] = match
            return ["id": id, "title": match.title, "subtitle": match.subtitle, "provider": "apple"]
          }
          promise.resolve(results)
        case .failure:
          promise.reject("ERR_SEARCH", "Address search is unavailable. Check your connection and try again.")
        }
      }
    }.runOnQueue(.main)

    AsyncFunction("resolve") { (id: String, session: String, promise: Promise) in
      guard self.sessionId == session, let completion = self.completions[id] else {
        promise.reject("ERR_PLACE", "This result has expired. Search for the address again.")
        return
      }
      self.localSearch?.cancel()
      let search = MKLocalSearch(request: MKLocalSearch.Request(completion: completion))
      self.localSearch = search
      search.start { response, error in
        guard error == nil, let item = response?.mapItems.first else {
          promise.reject("ERR_PLACE", "Could not load this place. Please try again.")
          return
        }
        let point = item.placemark.coordinate
        guard CLLocationCoordinate2DIsValid(point) else {
          promise.reject("ERR_PLACE", "This place has no pickup coordinates. Choose another result.")
          return
        }
        promise.resolve([
          "id": "apple:\(point.latitude):\(point.longitude)", "provider": "apple",
          "name": item.name ?? completion.title,
          "address": item.placemark.title ?? [completion.title, completion.subtitle].filter { !$0.isEmpty }.joined(separator: ", "),
          "latitude": point.latitude, "longitude": point.longitude
        ] as [String: Any])
      }
    }.runOnQueue(.main)

    AsyncFunction("endSession") { (session: String) in
      if self.sessionId == session {
        self.completionSearch?.cancel()
        self.completionSearch = nil
        self.localSearch?.cancel()
        self.localSearch = nil
        self.completions.removeAll()
        self.sessionId = nil
      }
    }.runOnQueue(.main)

    OnDestroy {
      DispatchQueue.main.async {
        self.completionSearch?.cancel()
        self.completionSearch = nil
        self.localSearch?.cancel()
      }
    }
  }
}
