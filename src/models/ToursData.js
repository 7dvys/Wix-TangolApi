import { fetchGet } from '../modules/fetchGet.js';

export class ToursData{   
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

        for(const key in listOfCountries['ListCountries']){
            const countryIsoCode = listOfCountries['ListCountries'][key]['IsoCode'];
            
            listOfCountries['ListCountries'][key]['Destinations'] = await this.appendDestinations(countryIsoCode); // Destinations
        }

        this.listToursData = listOfCountries['ListCountries'];
    }

    async appendDestinations(countryIsoCode){
        const countryDestinations = new CountryDestinations(countryIsoCode);
        let listOfDestinations = await countryDestinations.getDestinations();

        for(const key in listOfDestinations['ListDestinations']){
            const destinationCode = listOfDestinations['ListDestinations'][key]['Id'];

            listOfDestinations['ListDestinations'][key]['Tours'] = await this.appendDestinationTours(destinationCode); // Tours
        }

        return listOfDestinations['ListDestinations'];
    }

    async appendDestinationTours(destinationCode){
        const destinationTours = new DestinationTours(destinationCode);
        let listOfTours = await destinationTours.getTours();

        for(const key in listOfTours['ListTours']){
            const tourId = listOfTours['ListTours'][key]['TourId'];

            listOfTours['ListTours'][key]['TourRates'] = await this.appendTourRates(tourId);
        }
        console.log(listOfTours['ListTours'])

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

export class TourCountries{
    
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
