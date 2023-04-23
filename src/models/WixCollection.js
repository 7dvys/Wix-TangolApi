// import wixData from 'wix-data';
import { TangolApi } from "./TangolApi.js";

class WixCollections{
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
        
        // wixData.bulkSave(this.tableInformationId,tableInformation);
        // wixData.bulkSave(tableId,listCountries);

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

        // wixData.bulkSave(this.tableInformationId,tableInformation);
        // wixData.bulkSave(tableId,listDestinations);
       
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

        // wixData.bulkSave(this.tableInformationId,tableInformation);
        // wixData.bulkSave(tableId,listDestinations);

        console.log('Tangol Tours Updated.')

    }
}

const wixCollection = new WixCollections();
wixCollection.fillWixDb();