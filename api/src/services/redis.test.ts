import {describe, expect, test, beforeAll, afterAll} from '@jest/globals';
import * as redis from "./redis"

describe('Redis', () => {
	beforeAll(async () => {
	});

	afterAll(async () => {
	});

	test('Should connect to the redis server', async () => {
		const client = await redis.getClient()
        expect(client.isReady).toBe(true)
	})

    test('Should publish/subscribe', async () => {
        let message:string = ""
        let count = 0
        const subscriber1 = await redis.subscribe('test', (msg) => {
            message = msg
            count++
        })

        const subscriber2 = await redis.subscribe('test', (msg) => {
            count++
        })

        const p = await redis.publish('test', 'test message')
        await new Promise(r => setTimeout(r, 200))
        expect(p).toBe(2)
        expect(count).toBe(2)
        expect(message).toBe('test message')
        const valid1 = await redis.unsubscribe(subscriber1)
        expect(valid1).toBe(true)
        const valid2 = await redis.unsubscribe(subscriber2)
        expect(valid2).toBe(true)
	})

    test('Should get/set/delete', async () => {
        const obj = {f1: 'test message', f2: 'test message 2', f3: [1, 2, 3]}
        
        const valid = await redis.save('test', obj)
        expect(valid).toBe(true)
        const oobj = await redis.get('test')
        expect(oobj).toStrictEqual(obj)

        const wrongfield = await redis.get('test', ['obj'])
        expect(wrongfield).toEqual(null)

        const oneField = await redis.get('test', ['f2'])
        expect(oneField).toStrictEqual({f2: 'test message 2'})

        const multiFields = await redis.get('test', ['f1', 'f3'])
        expect(multiFields).toStrictEqual({f1: 'test message', f3: [1, 2, 3]})

        await redis.save('test', 'test message 4', "f4")
        const oobj2 = await redis.get('test')
        expect(oobj2).toStrictEqual({...obj, f4: 'test message 4'})

        const valid2 = await redis.remove('test')
        expect(valid2).toBe(true)
        const o2 = await redis.get('test')
        expect(o2).toBeNull()
    })

    test('Should create data with expiry', async () => {
        const obj = {f1: 'test message', f2: 'test message 2', f3: [1, 2, 3]}
        
        const valid = await redis.save('test', obj, "$", 1)
        expect(valid).toBe(true)

        await new Promise(r => setTimeout(r, 1100))

        const oobj = await redis.get('test')
        expect(oobj).toBeNull()
    })

    test('Should disconnect', async () => {
        const valid = await redis.disconnect()
        expect(valid).toBe(true)
    })

});