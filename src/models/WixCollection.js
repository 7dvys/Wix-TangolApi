import wixData from 'wix-data';
import { TangolApi } from "backend/TangolApi/models/TangolApi.jsw";

export class WixCollections{
    constructor(){
        this.tableInformationId = 'TangolTablesResume'
    }

    async fillWixDb(){
        try {
            this.tangolApi = new TangolApi();
            const listIsoCodes = await this.appendToTangolPaises();
            const listDestinationsIds = await this.appendToTangolDestinosPorPais(listIsoCodes);
            const listToursIds = await this.appendToTangolToursPorDestino(listDestinationsIds);

            
        } catch (error) {
            console.error('Error: '+error);
            return false;
        }

    }

    async appendToTangolPaises(){ 
        const tableId = 'TangolPaises'
        const {listCountries,listIsoCodes} = await this.tangolApi.getListCountries();

        const tableInformation = {
            _id:tableId,
            tableName:tableId,
            elementsId:listIsoCodes
        }
        
        wixData.bulkSave(this.tableInformationId,[tableInformation])
        .then(results=>{
            if(results.errors.length != 0){
                console.log(results.errors)
            }
        })
        .catch(error=>{console.error(error)});

        wixData.bulkSave(tableId,listCountries)
        .then(results=>{
            if(results.errors.length != 0){
                console.log(results.errors)
            }
        })
        .catch(error=>{console.error(error)});

        console.log('Tangol Paises Updated.')
        return listIsoCodes;
    }

    async appendToTangolDestinosPorPais(listIsoCodes){ // id: TangolDestinosPorPais
        const tableId = "TangolDestinosPorPais";
        const {listDestinations,listDestinationsIds} = await this.tangolApi.getDestinationsPerCountry(listIsoCodes);

        const tableInformation = {
            _id:tableId,
            tableName:tableId,
            elementsId:listDestinationsIds
        }

        wixData.bulkSave(this.tableInformationId,[tableInformation])
        .then(results=>{
            if(results.errors.length != 0){
                    console.log(results.errors)
            }
        })
        .catch(error=>{console.error(error)});

        wixData.bulkSave(tableId,listDestinations)
        .then(results=>{
            if(results.errors.length != 0){
                console.log(results.errors)
            }
        })
        .catch(error=>{console.error(error)});
    
        console.log('Tangol Destinos Updated.')
        return listDestinationsIds;
    }

    async appendToTangolToursPorDestino(listDestinationsIds){ // id: TangolToursPorDestinos
        const tableId = "TangolToursPorDestinos";
       const {listTours,listToursIds} = await this.tangolApi.getToursPerDestinations(listDestinationsIds);

       const tableInformation = {
        _id:tableId,
        tableName:tableId,
        elementsId:listToursIds
        }


        wixData.bulkSave(this.tableInformationId,[tableInformation])
        .then(results=>{
            if(results.errors.length != 0){
                    console.log(results.errors)
            }
        })
        .catch(error=>{console.error(error)});

        
        const bulkMaxItemsPerPetition = 1000;
        const petitionTotalItems = listTours.length;
        const timesPetitions = Math.trunc(petitionTotalItems/bulkMaxItemsPerPetition);

        for(let time = 0; time < timesPetitions; time++ ){
            const a = time*1000;
            const b = ((time+1)*1000)-1;

            const listToursSlice = listTours.slice(a,b);

            wixData.bulkSave(tableId,listToursSlice)
            .then(results=>{
                if(results.errors.length != 0){
                    console.log(results.errors)
                }
            })
            .catch(error=>{console.error(error)});
        }

        const listToursSlice = listTours.slice(timesPetitions*bulkMaxItemsPerPetition,petitionTotalItems);

        wixData.bulkSave(tableId,listToursSlice)
        .then(results=>{
            if(results.errors.length != 0){
                console.log(results.errors)
            }
        })
        .catch(error=>{console.error(error)});

        console.log('Tangol Tours Updated.')

    }
}
