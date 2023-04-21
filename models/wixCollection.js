// import wixData from 'wix-data';

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
