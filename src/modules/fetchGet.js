import fetch from 'node-fetch'
// import {fetch} from 'wix-fetch';

const apiToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJjZW9fZWdAc3VubGl0amV0cy5jb20iLCJhdWQiOiI0NjYxOCJ9.H-4acwLUEMae63MU0iKd6bop-JMyYpdzBFns_gWd-v8"
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

export async function fetchGet(endpoint,parameters={},body={}){
    const url = new FetchUrl(endpoint,parameters).url
    const token = apiToken;
    
    let config = {
        headers:{
            "Content-Type": "application/json",
            "Authorization":"Bearer "+token
        }        
    }

    if(body != {} && typeof body == 'object'){
        config['body']=JSON.stringify(body);
        config['method']='POST';
    }

    try {
        const response = await fetch(url,config);
        if(response.ok){
            const jsonData = await response.json();
            return jsonData;
        }
    } catch (error) {
        console.error('Error al descargar datos:'+error.message)
        return false;
    }
}
