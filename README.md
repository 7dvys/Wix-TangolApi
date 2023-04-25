# Wix-TangolApi
The goal of this project is to implement the Tangol API in a Wix application. The Tangol API provides information about countries, their destinations, and the tours available in each destination. Wix collections are used to store this information.

# How To Use
Put src/* in the wix backend then use jobs.config to run fillWixDb() from TangolActions to fill the wix db. fillWixDb() update the items and delete the items thats there isn't in the updated items list. 