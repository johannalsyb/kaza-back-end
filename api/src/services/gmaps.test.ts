import {describe, expect, test, beforeAll, afterAll} from '@jest/globals';
import {autocomplete, geocodeZone, searchAddress, validateAddress} from "./gmaps"

describe('Address validation', () => {
	beforeAll(async () => {
	});

	afterAll(async () => {
	});


    test('Should validate the address', async () => {
		const r = await searchAddress("94 traverse prat batiment G")
		expect(r).toBeDefined()
		expect(r!.country).toEqual("France")
        expect(r!.address).toEqual("94 Trav. Prat, 13008 Marseille, France")
        expect(r!.geocode).toBeDefined()
        expect(r!.geocode.location).toBeDefined()
        expect(r!.geocode.bounds).toBeDefined()
	})

    test('Should autocomplete the address', async () => {
        const suggestions = await autocomplete("Marseille")
        expect(suggestions).toBeDefined()
        expect(suggestions.length).toBeGreaterThan(0)
    })

    test('Should autocomplete the address 2', async () => {
        const suggestions = await autocomplete("Largo Conde-Barao 18")
        expect(suggestions).toBeDefined()
        expect(suggestions.length).toBeGreaterThan(0)
    })
});