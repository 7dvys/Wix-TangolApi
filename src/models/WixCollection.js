import wixData from 'wix-data'; //On wix
// import { TangolApi } from '../models/TangolApi.js'; // On localhost NodeJs
import { TangolApi } from "backend/TangolApi/models/TangolApi.jsw"; // On wix

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
            this.clearTangolTables();

            
        } catch (error) {
            console.error('Error: '+error);
            return false;
        }
    }

    async cleanWixDb(){

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

        await wixData.bulkSave(this.tableInformationId,[tableInformation])
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

            await wixData.bulkSave(tableId,listToursSlice)
            .then(results=>{
                if(results.errors.length != 0){
                    console.log(results.errors)
                }
            })
            .catch(error=>{console.error(error)});
        }

        const listToursSlice = listTours.slice(timesPetitions*bulkMaxItemsPerPetition,petitionTotalItems);

        await wixData.bulkSave(tableId,listToursSlice)
        .then(results=>{
            if(results.errors.length != 0){
                console.log(results.errors)
            }
        })
        .catch(error=>{console.error(error)});

        console.log('Tangol Tours Updated.')
    }

    async clearTangolTables(){
        const tableResumeName = 'TangolTablesResume'

        wixData.query(tableResumeName).find()
        .then(async results => {
            
            for(const item of results.items){

                const tableId = item['_id'];
                const listTableResumeIds = item['elementsId'];

                wixData.query(tableId)
                .not(
                wixData.query(tableId).hasSome('_id',listTableResumeIds)
                )
                .limit(1000)
                .find()  
                .then(async results=>{
                    if(results.items.length > 0 ){
                        let resultsToDelete = results;
                        const listItemsToDelete = resultsToDelete.items.map(item => {
                            return item._id;
                        })
                        wixData.bulkRemove(tableId,listItemsToDelete)
                        .then((results)=>{
                            console.log(`removed ${results.removedItemIds.length} of ${listItemsToDelete.length}`)
                            console.log('items removed:',results.removedItemIds);
                        })
                        .catch(error => {console.error(error)});
                        while(resultsToDelete.hasNext()){
                            resultsToDelete = await resultsToDelete.next()
                            const listItemsToDelete = resultsToDelete.items.map(item => {
                                return item._id;
                            })
                            wixData.bulkRemove(tableId,listItemsToDelete)
                            .then((results)=>{
                                console.log(`removed ${results.removedItemIds.length} of ${listItemsToDelete.length}`)
                                console.log('items removed:',results.removedItemIds);
                            })
                            .catch(error => {console.error(error)});
                        }
                    }

                    console.log(tableId+' cleaned.')
                })
                .catch(error => {console.log(error)})
                        
            }
        })
        .catch(error => {console.log(error)});
    }
}
