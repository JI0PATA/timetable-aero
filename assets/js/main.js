const API = 'https://airport.api.aero/airport/v2/';
const tokenAirport = '1fc21ff3d4e26ba977b7e8304480f070';
let headersAirport = {
  'x-apikey': tokenAirport,
  'Accept': 'application/json'
};
const tokenFlights = 'f1f9e5-f0b5db';
const timetableAPI = `http://aviation-edge.com/v2/public/timetable?key=${tokenFlights}`;


let app = new Vue({
  el: '#app',
  data: {
    preloader: true,
    airports: [],
    airportsMatch: [],
    tab: 'arrival',
    curAirport: {},
    flights: [],
    airportName: '',
    test: false,
    paginate: '1',
    preloader_circle: false,
  },
  methods: {
    async getInfoFlights() {
      if (this.airportName.trim().length === 0) return;

      this.preloader_circle = true;

      let matchAirportResponse = await fetch(`https://airport.api.aero/airport/v2/match/${this.airportName}`, {
        method: "get",
        headers: headersAirport
      })
        .then(r => r.json());

      this.curAirport = matchAirportResponse.airports[0];

      flightsCurAirportResponse = await fetch(timetableAPI + `&iataCode=${this.curAirport.iatacode}&type=${this.tab}`)
        .then(r => r.json());

      let flight_length = flightsCurAirportResponse.length;

      if (this.tab === 'arrival') {
        for (let i = 0; i < flight_length; i++) {
          let curFlight = flightsCurAirportResponse[i];

          curFlight.City = await this.getInfoAirportByIataCode(curFlight.departure.iataCode);
          curFlight.time = this.convertDate(curFlight.departure.scheduledTime);
          curFlight.terminal = curFlight.arrival.terminal;
        }
      } else if (this.tab === 'departure') {
        for (let i = 0; i < flight_length; i++) {
          let curFlight = flightsCurAirportResponse[i];

          curFlight.City = await this.getInfoAirportByIataCode(curFlight.arrival.iataCode);
          curFlight.time = this.convertDate(curFlight.arrival.scheduledTime);
          curFlight.terminal = curFlight.departure.terminal;
        }
      }

      this.flights = await flightsCurAirportResponse;

      this.preloader_circle = false;
    },

    convertDate(date_string) {
      let date = new Date(date_string);

      let hours = date.getHours();
      let minutes = date.getMinutes();

      if (hours < 10) hours = '0' + hours;
      if (minutes < 10) minutes = '0' + minutes;

      return `${hours}:${minutes}`;
    },

    inputAirportsMatch(ev) {
      let name_match = ev.target.value.trim();
      let regexp = new RegExp(`${name_match}`, 'i');

      this.airportsMatch = [];

      this.airports.forEach(airport => {
        if (this.airportsMatch.length === 20) return;

        if (regexp.test(airport.city + ' ' + airport.name))
          this.airportsMatch.push(airport);
      });
    },

    async getInfoAirportByIataCode(iatacode) {

      let infoAirportResponse = await fetch(`https://airport.api.aero/airport/v2/airport/${iatacode}`, {
        method: "get",
        headers: headersAirport
      })
        .then(r => r.json());

      return await infoAirportResponse.airports[0].city;
    },

    setTab(changeTab) {
      this.tab = changeTab;

      this.getInfoFlights();
    }


  },
  async created() {
    await fetch('https://airport.api.aero/airport/v2/airports', {
      method: "get",
      headers: headersAirport
    })
      .then(r => r.json())
      .then(res => {
        this.airports = res.airports;

        for (let i = 0; i < 20; i++) {
          this.airportsMatch.push(this.airports[i]);
        }
      });

    setTimeout(_ => {
      this.preloader = false;
    }, 500);
  }
});