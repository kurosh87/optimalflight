declare module 'amadeus' {
  export default class Amadeus {
    constructor(config: { clientId: string; clientSecret: string });
    shopping: any;
    referenceData: any;
  }
}
