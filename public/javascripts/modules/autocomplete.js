function autocomplete(input, latInput, lngInput) {
  if(!input) return; // skip this fn from running if there is not input on the page
  // console.log(input, latInput, longInput);

  const dropdown = new google.maps.places.Autocomplete(input);
  dropdown.addListener('place_changed', () => {
    const place = dropdown.getPlace();
    console.log(place);
    latInput.value = place.geometry.location.lat();
    lngInput.value = place.geometry.location.lng();

  });
  //if someone hits enter, don't submit form
  input.on('keydown', (e) => {
    if (e.keyCode === 13) e.preventDefault();
  })
}

export default autocomplete;