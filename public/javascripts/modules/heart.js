import axios from 'axios';
import { $ } from './bling';

function ajaxHeart(e) {
  e.preventDefault();
  axios.post(this.action) // this = DOM Element (form), action - is it's attribute
    .then(res => {
      const isHearted = this.heart.classList.toggle('heart__button--hearted'); 
      // this = form, this.heart = means form has some element with attribute name="heart" (DOM element button in our case)
      //classList.toggle, apprt from toggling the class, returns true if there is such class, and false if no such class
      // console.log(isHearted);

      $('.heart-count').textContent = res.data.hearts.length;

      if(isHearted) {
        this.heart.classList.add('heart__button--float');
        setTimeout(() => this.heart.classList.remove('heart__button--float'), 2000);
      }
    })
    .catch(err => console.error(err));
}

export default ajaxHeart;