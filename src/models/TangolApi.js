// import { fetchGet } from '../modules/fetchGet.js'; // On localhost nodeJs
import { fetchGet } from 'backend/TangolApi/modules/fetchGet.jsw'; // on wix .jsw


export class TangolApi{   
    
    async getListCountries(){
        const tourCountries = new TourCountries();
        const listCountries =await tourCountries.getCountries()
        let listIsoCodes = [];

        for(const key in listCountries['ListCountries']){
            const isoCode = listCountries['ListCountries'][key]['IsoCode'];
            listIsoCodes.push(isoCode);
            listCountries['ListCountries'][key]['_id'] = isoCode;            
        }
        
        return {listCountries:listCountries['ListCountries'],listIsoCodes};
    }

    async getDestinationsPerCountry(listIsoCodes){
        
        let listDestinationsIds = [];
        let listDestinations = [];
        for(const isoCode of listIsoCodes){

            const countryDestinations = new CountryDestinations(isoCode);
            let jsonDestinations = await countryDestinations.getDestinations();

            for(const key in jsonDestinations['ListDestinations']){
                const destinationId = jsonDestinations['ListDestinations'][key]['Id'].toString();

                jsonDestinations['ListDestinations'][key]['_id']=destinationId;
                jsonDestinations['ListDestinations'][key]['Id']=destinationId;
                listDestinationsIds.push(destinationId);
            }
            listDestinations.push(...jsonDestinations['ListDestinations'])
        }
        return {listDestinations,listDestinationsIds};
    }

    async getToursPerDestinations(listDestinationsIds){

        let listTours = [];
        let listToursIds = [];
        for(const destinationId of listDestinationsIds){
            const destinationTours = new DestinationTours(destinationId);

            for(const languageCode of ["ESP","ENG"]){

                let listToursPerDestination = await destinationTours.getTours(languageCode);

                for(const key in listToursPerDestination['ListTours']){
                    const tourId = (listToursPerDestination['ListTours'][key]['TourId']+'_'+languageCode).toString();
                    
                    listToursPerDestination['ListTours'][key]['_id']=tourId;
                    listToursPerDestination['ListTours'][key]['TourId']=tourId;
                    listToursPerDestination['ListTours'][key]['DestinationId']=destinationId.toString();
                    
                    listToursIds.push(tourId);
                }

                listTours.push(...listToursPerDestination['ListTours']);
            }

        }
        return {listTours,listToursIds};
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

    async getTours(languageCode="ESP",currency="USD"){
        const params = {
            "DestinationId":[this.destinationCode],
            "LanguageCode":[languageCode],
            "Currency":[currency],
            "IncludeDetails":["N"]};
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
    
    constructor(tourId,languageCode = "ESP",currency = "USD"){
        this.apiDetailsEndpoint = "/GetTourDetails";
        this.apiRatesEndpoint = "/GetTourRates"
        this.tourId = tourId;
        this.params = {
            "tourId":[this.tourId],
            "LanguageCode":[languageCode],
            "Currency":[currency],
            "IncludeDetails":["N"]
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
