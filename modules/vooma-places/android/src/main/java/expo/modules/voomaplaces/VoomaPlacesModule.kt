package expo.modules.voomaplaces

import android.content.pm.PackageManager
import com.google.android.gms.maps.model.LatLng
import com.google.android.gms.tasks.CancellationTokenSource
import com.google.android.libraries.places.api.Places
import com.google.android.libraries.places.api.model.AutocompleteSessionToken
import com.google.android.libraries.places.api.model.CircularBounds
import com.google.android.libraries.places.api.model.Place
import com.google.android.libraries.places.api.net.FetchPlaceRequest
import com.google.android.libraries.places.api.net.FindAutocompletePredictionsRequest
import com.google.android.libraries.places.api.net.PlacesClient
import expo.modules.kotlin.Promise
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class VoomaPlacesModule : Module() {
  private var client: PlacesClient? = null
  private val sessions = mutableMapOf<String, AutocompleteSessionToken>()
  private val searches = mutableMapOf<String, CancellationTokenSource>()

  private fun places(): PlacesClient {
    client?.let { return it }
    val context = requireNotNull(appContext.reactContext)
    val info = context.packageManager.getApplicationInfo(context.packageName, PackageManager.GET_META_DATA)
    val key = info.metaData?.getString("com.google.android.geo.API_KEY")
    require(!key.isNullOrBlank()) { "Address search is not configured in this build." }
    if (!Places.isInitialized()) Places.initializeWithNewPlacesApiEnabled(context, key)
    return Places.createClient(context).also { client = it }
  }

  override fun definition() = ModuleDefinition {
    Name("VoomaPlaces")

    AsyncFunction("search") { query: String, latitude: Double?, longitude: Double?, session: String, promise: Promise ->
      try {
        val api = places()
        searches.remove(session)?.cancel()
        val cancellation = CancellationTokenSource()
        searches[session] = cancellation
        val token = sessions.getOrPut(session) { AutocompleteSessionToken.newInstance() }
        val builder = FindAutocompletePredictionsRequest.builder()
          .setQuery(query.take(200))
          .setSessionToken(token)
          .setCancellationToken(cancellation.token)
          .setRegionCode("ZA")
        if (latitude != null && longitude != null) {
          builder.setLocationBias(CircularBounds.newInstance(LatLng(latitude, longitude), 50000.0))
        }
        api.findAutocompletePredictions(builder.build())
          .addOnSuccessListener { response ->
            promise.resolve(response.autocompletePredictions.map { prediction ->
              mapOf("id" to prediction.placeId, "title" to prediction.getPrimaryText(null).toString(),
                "subtitle" to prediction.getSecondaryText(null).toString(), "provider" to "google")
            })
          }
          .addOnFailureListener { promise.reject("ERR_SEARCH", "Address search is unavailable. Check your connection and try again.", null) }
          .addOnCanceledListener { promise.reject("ERR_CANCELLED", "Search cancelled.", null) }
      } catch (_: Exception) {
        promise.reject("ERR_SEARCH_CONFIG", "Address search is not available in this build. Please try again later.", null)
      }
    }.runOnQueue(Queues.MAIN)

    AsyncFunction("resolve") { id: String, session: String, promise: Promise ->
      try {
        val fields = listOf(Place.Field.ID, Place.Field.DISPLAY_NAME, Place.Field.FORMATTED_ADDRESS, Place.Field.LOCATION)
        val builder = FetchPlaceRequest.builder(id, fields)
        sessions[session]?.let { builder.setSessionToken(it) }
        places().fetchPlace(builder.build())
          .addOnSuccessListener { response ->
            sessions.remove(session)
            val place = response.place
            val location = place.location
            if (location == null) {
              promise.reject("ERR_PLACE", "This place has no pickup coordinates. Choose another result.", null)
            } else {
              promise.resolve(mapOf("id" to "google:${place.id ?: id}", "provider" to "google",
                "providerId" to (place.id ?: id), "name" to (place.displayName ?: place.formattedAddress ?: "Selected place"),
                "address" to (place.formattedAddress ?: place.displayName ?: "Selected place"),
                "latitude" to location.latitude, "longitude" to location.longitude))
            }
          }
          .addOnFailureListener { promise.reject("ERR_PLACE", "Could not load this place. Please try again.", null) }
      } catch (_: Exception) {
        promise.reject("ERR_SEARCH_CONFIG", "Address search is not available in this build. Please try again later.", null)
      }
    }.runOnQueue(Queues.MAIN)

    AsyncFunction("endSession") { session: String ->
      searches.remove(session)?.cancel()
      sessions.remove(session)
    }.runOnQueue(Queues.MAIN)

    OnDestroy {
      searches.values.forEach { it.cancel() }
      searches.clear()
      sessions.clear()
    }
  }
}
