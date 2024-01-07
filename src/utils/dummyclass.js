class User {
  constructor(firstname, lastname, anime) {
    this.firstname = firstname;
    this.lastname = lastname;
    this.anime = anime;
  }
  getcharacterdetails() {
    let characterswag = `I am ${this.firstname} ${this.lastname} from ${this.anime}`;
    return characterswag;
  }

  editanimedetails(anime) {
    this.anime = anime;
  }
}

let hinata = new User("Hinata", "Naruto");

console.log(hinata);
console.log(hinata.getcharacterdetails());
hinata.editanimedetails("hayaku");

console.log(hinata);
console.log(hinata.getcharacterdetails());
console.log(null === null);
let print = console.log;
print("hello");
