import { fetchGet } from './modules/fetch.js';

const apiToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJjZW9fZWdAc3VubGl0amV0cy5jb20iLCJhdWQiOiI0NjYxOCJ9.H-4acwLUEMae63MU0iKd6bop-JMyYpdzBFns_gWd-v8"
let apiUrl = "https://www.tangol.com/TangolApi/Tour";

class ToursData{    
    constructor(){
        this.listToursData = [];
    }

    async getJsonTangolToursData(){
        await this.appendCountries()
        return this.listToursData;
    }
    
    async appendCountries(){
        const tourCountries = new TourCountries();
        const listOfCountries =await tourCountries.getCountries()

        let promises = [];

        for(const country of listOfCountries['ListCountries']){

            const countryName = country['Description'];
            const countryIsoCode = country['IsoCode'];
            
            promises.push(this.appendDestinations(countryIsoCode)); // Destinations
        }

        let results = await Promise.all(promises);

        for(const key in results){
            const destinations = results[key];
            listOfCountries['ListCountries'][key]['Destinations'] = destinations;
        }

        this.listToursData = listOfCountries['ListCountries'];
    }

    async appendDestinations(countryIsoCode){
        const countryDestinations = new CountryDestinations(countryIsoCode);
        let listOfDestinations = await countryDestinations.getDestinations();

        let promises = [];

        for(const key in listOfDestinations['ListDestinations']){
            const destinationCode = listOfDestinations['ListDestinations'][key]['Id'];

            promises.push(this.appendDestinationTours(destinationCode)); // Tours
        }
        
        let results = await Promise.all(promises);
        
        for(const key in results){
            const tours = results[key];
            listOfDestinations['ListDestinations'][key]['Tours'] = tours
        }

        return listOfDestinations['ListDestinations'];
    }

    async appendDestinationTours(destinationCode){
        const destinationTours = new DestinationTours(destinationCode);
        let listOfTours = await destinationTours.getTours();

        // let tourIdList = [];

        for(const key in listOfTours['ListTours']){
            const tourId = listOfTours['ListTours'][key]['TourId'];
            // tourIdList.push(tourId);         
            listOfTours['ListTours'][key]['TourRates'] = await this.appendTourRates(tourId);
        }

        // TourDetails viene con Tour
        // const details = await this.appendTourDetailsList(tourIdList);
        // Aparentemente no funciona el endpoint
        // const rates = await this.appendTourRatesList(tourIdList);
        // for(const key in tourIdList){
        //     const id = tourIdList
        //     // listOfTours['ListTours'][key]['Details'] = details[key]
        //     listOfTours['ListTours'][key]['Rates'] = rates[key]
        // }

        return listOfTours['ListTours'];
    }

    async appendTourDetailsList(tourIdList){
        const tourDetailsAndRates = new TourDetailsAndRatesList(tourIdList);
        const tourDetails = await tourDetailsAndRates.getTourDetailsList();
        return tourDetails;
    }
    
    async appendTourRatesList(tourIdList){
        const tourDetailsAndRates = new TourDetailsAndRatesList(tourIdList);
        const tourRates = await tourDetailsAndRates.getTourRatesList();
        return tourRates;
    }

    async appendTourRates(tourId){
        const tourDetailsAndRates = new TourDetailsAndRates(tourId);
        const tourRates = await tourDetailsAndRates.getTourRates();
        return tourRates;
    }
}



class TourCountries{
    
    constructor(){
        this.apiEndpoint = "/GetTourCountries";
    }
    
    async getCountries(){ 
        const listCountries = await fetchGet(this.apiEndpoint)
        return listCountries;
    }
}


class CountryDestinations{
    
    constructor(countryIsoCode){
        this.apiEndpoint = "/GetTourDestinations"
        this.countryIsoCode = countryIsoCode;
    }

    async getDestinations(){
        const params = {"CountryCode": [this.countryIsoCode]};
        const destinations =await fetchGet(this.apiEndpoint,params);

        return destinations;
    }
}

class DestinationTours{
    
    constructor(destinationCode){
        this.apiEndpoint = "/GetTourListByDestination"
        this.destinationCode = destinationCode;
    }

    async getTours(){
        const params = {"DestinationId":[this.destinationCode],"IncludeDetails":["Y"]};
        const tours = await fetchGet(this.apiEndpoint,params);
        return tours;
    }
}

class TourDetailsAndRatesList{
    
    constructor(tourIdList){
        this.apiDetailsEndpoint = "/GetTourDetailsList";
        this.apiRatesEndpoint = "/GetTourRatesIdList"
        this.tourIdList = tourIdList;
        this.params = {
            "TourIdList":this.tourIdList,
            "LanguageCode":["ESP"],
            "Currency":["USD"]
        }
    }

    async getTourDetailsList(){
        const details = await fetchGet(this.apiDetailsEndpoint,this.params);
        
        return details;
    }

    async getTourRatesList(){
        const rates = await fetchGet(this.apiRatesEndpoint,this.params);
        return rates;
    }
}

class TourDetailsAndRates{
    
    constructor(tourId,languageCode = "ESP"){
        this.apiDetailsEndpoint = "/GetTourDetails";
        this.apiRatesEndpoint = "/GetTourRates"
        this.tourId = tourId;
        this.params = {
            "tourId":[this.tourId],
            "LanguageCode":[languageCode],
            "Currency":["USD"]
        }
    }

    async getTourDetails(){
        const details = await fetchGet(this.apiDetailsEndpoint,this.params);
        return details;
    }

    async getTourRates(){
        const rates = await fetchGet(this.apiRatesEndpoint,this.params);
        return rates;
    }
}

export function fillWixDb(){
    const wixCollection = new WixCollection();
    wixCollection.fillWixDb();
}
