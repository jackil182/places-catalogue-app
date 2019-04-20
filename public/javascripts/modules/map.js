import axios from 'axios';
import { $ } from './bling';

const mapOptions = {
  center: {
    lat: 43.25,
    lng: -79.88
  },
  zoom: 11.5,
}

function loadPlaces(map, lat=43.2, lng=-79.8) {
  // can use this for getting realtime location -> navigator.geolocation.getCurrentPosition
  axios.get(`/api/stores/near?lat=${lat}&lng=${lng}`)
    .then(res => {
      const places = res.data;
      // console.log(places);
      if(!places.length) {
        alert('no places found');
        return;
      };

      // create bounds for our map (centers markers and applies apropriate zoom)
      const bounds = new google.maps.LatLngBounds();

      // for displaying popups
      const infoWindow = new google.maps.InfoWindow();

      const markers = places.map(el => {
        const [placeLng, placeLat] = el.location.coordinates;
        const position = { lat: placeLat, lng: placeLng };
        bounds.extend(position);
        const marker = new google.maps.Marker({ map, position });
        marker.place = el;
        return marker;
      });

      // when someone clicks on a marker, show place info
      markers.forEach(el => el.addListener('click', function() {   // addListener is google's alternative to addEvenetListener
        const marker = this;
        const html = `
        <div class="popup">
          <a href="/store/${marker.place.slug}">
            <img src="/uploads/${marker.place.photo || 'store.png'}" alt="${marker.place.name}" />
            <p>${marker.place.name} - ${marker.place.location.address}</p>
          </a>
        </div>
        `
        infoWindow.setContent(html);
        infoWindow.open(map, marker);
        console.log(marker);
      }))

      // then zoom the map to fit all markers perfectly
      map.setCenter(bounds.getCenter()); // centers markers
      map.fitBounds(bounds); // zooms in
      // console.log(markers);
    })
}

function makeMap(mapDiv) {
  if(!mapDiv) return;

  // make our map
  const map = new google.maps.Map(mapDiv, mapOptions);
  loadPlaces(map);

  const input = $('[name="geolocate"]');
  const autocomplete = new google.maps.places.Autocomplete(input);
  autocomplete.addListener('place_changed', () => {
    const place = autocomplete.getPlace();
    loadPlaces(map, place.geometry.location.lat(), place.geometry.location.lng());
  })
  // console.log(input);
}

export default makeMap;
