import {describe, expect, test, beforeAll, afterAll} from '@jest/globals';
import adapter from "../adapters/fastify"
import auth, { setSkipAuth } from "./auth"
import {
    AUTH_HEADER,
    AUTH_HEADER_REFRESH,
    AUTH_SKIP
} from "../config";

const app = adapter({
	routes: {
		"noauth": {
			get: (req, res) => {
				res.send("Success")
			},
			middlewares: [auth]
		},
		"auth": {
			get: (req, res) => {
				res.send("Success")
			},
			post: (req, res) => {
				res.send("Success")
			},
			middlewares: [auth]
		}
	}
}).app


describe('Events endpoints', () => {
	beforeAll(async () => {
	});

	afterAll(async () => {
	});


    test('Should be able to access non protected endpoints without auth', async () => {
		setSkipAuth(true)
		const response = await app.inject({
			method: 'GET',
			url: '/noauth'
		})
		expect(response.statusCode).toEqual(200)
	})

	test('Should be able to access non protected endpoints with auth', async () => {
        const response = await app.inject({
			method: 'GET',
			url: '/noauth',
			headers: {
				[AUTH_HEADER]: "test"
			}
		})
		expect(response.statusCode).toEqual(200)
	})

	test('Should NOT be able to access protected endpoints without auth', async () => {
		setSkipAuth(false)
		const response = await app.inject({
			method: 'GET',
			url: '/auth'
		})
		expect(response.statusCode).toEqual(401)
	})

	test('Should NOT be able to access protected endpoints with a wrong auth', async () => {
        const r1 = await app.inject({
			method: 'GET',
			url: '/auth',
			headers: {
				"WRONGHEADER": "test"
			}
		})
		expect(r1.statusCode).toEqual(401)
		
		const r2 = await app.inject({
			method: 'GET',
			url: '/auth',
			headers: {
				[AUTH_HEADER]: "wrong"
			}
		})
		expect(r2.statusCode).toEqual(401)
	})

	test('Should be able to access protected endpoints with a valid auth', async () => {
		const r2 = await app.inject({
			method: 'GET',
			url: '/auth',
			headers: {
				[AUTH_HEADER]: "test"
			}
		})
		expect(r2.statusCode).toEqual(200)
	})
});