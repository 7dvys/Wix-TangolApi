// import fetch from 'node-fetch'
import {fetch} from 'wix-fetch';
import wixData from 'wix-data';

const apiToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJjZW9fZWdAc3VubGl0amV0cy5jb20iLCJhdWQiOiI0NjYxOCJ9.H-4acwLUEMae63MU0iKd6bop-JMyYpdzBFns_gWd-v8"
let apiUrl = "https://www.tangol.com/TangolApi/Tour";
// apiUrl = "https://virtserver.swaggerhub.com/tangol/TangolTours/1.0.0"

class FetchUrl{
    constructor(endpoint,parameters){
        this.endpoint=endpoint;
        this.parameters = parameters;
    }
    
    buildQueryStringFromJson(){
        let queryString ='';
        let prefix = '?';
        
        for(const key in this.parameters){
            const currentParameter = this.parameters[key];
            const parameterValues = currentParameter.join(',')
            queryString+=prefix+key+'='+parameterValues;

            if(prefix == '?'){
                prefix = '&';
            }
        }
        return queryString;
    }
    get url(){
        const queryString = this.buildQueryStringFromJson();
        const finalUrl = apiUrl+this.endpoint+queryString;
        return finalUrl;
    }
}

async function fetchGet(endpoint,parameters={}){
    const url = new FetchUrl(endpoint,parameters).url
    const token = apiToken;
    
    const config = {
        headers:{
            "Content-Type": "application/json",
            "Authorization":"Bearer "+token
        }        
    }

    try {
        const response = await fetch(url,config);
        console.log(url)
        if(response.ok){
            const jsonData = await response.json();
            return jsonData;
        }
    } catch (error) {
        console.error('Error al descargar datos:'+error.message)
        return false;
    }
}

class WixCollection{

    async fillWixDb(){
        try {
            console.log('init')
            const toursData = new ToursData();
        
            this.listTourData = await toursData.getJsonTangolToursData();
            console.log('Datos descargados')
            await this.appendToTangolPaises();
            return true;
        } catch (error) {
            console.error('Error: '+error);
            return false;
        }

    }
    // BulkSave() update o inserta data, necesita _id para comparar. 
    // Aclarare los campos adicionales y los que no hay que incluir con + y -
    async appendToTangolPaises(){ //id: TangolPaises
        const tableId = 'TangolPaises'
        // - {...,Destinations:[]}
        let listDestinationsPerCountry = [];
        let listJsonCountryWithoutDestinations = [];

        for(let i = 0; i < this.listTourData.length; i++){
            const jsonCountry = this.listTourData[i];
            const IsoCode = jsonCountry['IsoCode'];
            
            jsonCountry['_id'] = IsoCode;
        
            const {Destinations,...jsonCountrywithoutDestinations} = jsonCountry;
            
            listDestinationsPerCountry.push(Destinations);
            listJsonCountryWithoutDestinations.push(jsonCountrywithoutDestinations);
        }

        await wixData.bulkSave(tableId,listJsonCountryWithoutDestinations);

        for(const key in listDestinationsPerCountry){
            const listDestinationsOfCountry = listDestinationsPerCountry[key];
            this.appendToTangolDestinosPorPais(listDestinationsOfCountry)
        }

    }

    async appendToTangolDestinosPorPais(listDestinationsOfCountry){ // id: TangolDestinosPorPais
        const tableId = "TangolDestinosPorPais";
        
        let jsonToursPerDestination = {};
        let listJsonDestinationWithoutTours = [];

        for(const jsonDestination of listDestinationsOfCountry){
            const destinationId = jsonDestination['Id']
            jsonDestination['_id']=destinationId;
            const {Tours,...jsonDestinationWithoutTours} = jsonDestination

            jsonToursPerDestination[destinationId] = Tours;
            listJsonDestinationWithoutTours.push(jsonDestinationWithoutTours);
        }

        await wixData.bulkSave(tableId,listJsonDestinationWithoutTours);

        for(const destinationId in jsonToursPerDestination){
            const listToursOfDestination = jsonToursPerDestination[destinationId];
            this.appendToTangolToursPorDestino(listToursOfDestination,destinationId);
        }

    }

    async appendToTangolToursPorDestino(listToursOfDestination,destinationId){ // id: TangolToursPorDestinos
        const tableToursId = "TangolToursPorDestinos";
        const tableDetailsId = "TourDetails";
        const tableRatesId = "TourRates";

        let listJsonTourDetails = [];
        let listJsonTourRates = [];
        let listJsonTourWithoutDetailsAndRates = [];
        
        for(const key in listToursOfDestination){
            listToursOfDestination[key]['DestinationId'] = destinationId;
            const jsonTour = listToursOfDestination[key];
            const {jsonTourDetails,jsonTourRates,...jsonTourWithoutDetailsAndRates} = jsonTour;

            listJsonTourWithoutDetailsAndRates.push(jsonTourWithoutDetailsAndRates);

            if(jsonTourDetails['status'] != "500"){
                listJsonTourDetails.push(jsonTourDetails);
            }

            if(jsonTourRates['status'] != "500"){
                listJsonTourRates.push(jsonTourRates);
            }
        }

        await wixData.bulkSave(tableToursId,listJsonTourWithoutDetailsAndRates);

        await wixData.bulkSave(tableDetailsId,listJsonTourDetails);
        await wixData.bulkSave(tableRatesId,listJsonTourRates);
    }
}

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
        let listOfDestinations = await countryDestinations.getDestinations()

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
