import fetch from 'node-fetch'
// import {fetch} from 'wix-fetch';

const apiToken = "yourToken"
let apiUrl = "https://www.tangol.com/TangolApi/Tour";

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

export async function fetchGet(endpoint,parameters={}){
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
