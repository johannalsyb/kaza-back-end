import { useEffect, useRef, useState } from "react"
import admin from "../../api/admin"
import { ActivityIndicator } from "react-native"
import variables from "../../styles/variables"
import Api from "@kazaswap/common/lib/types/api"

import Chart from 'chart.js';
import KNumberInput from "../../components/Form/KNumberInput/KNumberInput"

// Add typescript namespace window.Chart
declare global {
    interface Window {
        Chart: Chart;
    }
}

// Generate random HEX colors
const colors = [
    '#FF6633', '#FFB399', '#FF33FF', '#00B3E6', 
    '#E6B333', '#3366E6', '#999966', '#99FF99', '#B34D4D',
    '#80B300', '#809900', '#E6B3B3', '#6680B3', '#66991A', 
    '#FF99E6', '#CCFF1A', '#FF1A66', '#E6331A', '#33FFCC',
    '#66994D', '#B366CC', '#4D8000', '#B33300', '#CC80CC', 
    '#66664D', '#991AFF', '#E666FF', '#4DB3FF', '#1AB399',
    '#E666B3', '#33991A', '#CC9999', '#B3B31A', '#00E680', 
    '#4D8066', '#809980', '#E6FF80', '#1AFF33', '#999933',
    '#FF3380', '#CCCC00', '#66E64D', '#4D80CC', '#9900B3', 
    '#E64D66', '#4DB380', '#FF4D4D', '#99E6E6', '#6666FF'
]

const defaultChart = {
    type: 'line',
    data: {
        labels: [],
        datasets: []
    },
    options: {
        scales: {
        }
    }
}

export default () => {

    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState<{
        users: Date[],
        usersForRange?: number[],
        properties: Date[],
        propertiesForRange?: number[],
        swapRequests: Date[],
        swapRequestsForRange?: number[],
        swaps: Date[],
        swapsForRange?: number[]
    }>()
    const [lastNbDays, setLastNbDays] = useState<number>(14)
    const [range, setRange] = useState<[Date, Date]>([new Date(Date.now()-(lastNbDays*24*3600*1000)), new Date()])
    const [chart, setChart] = useState<Chart[]>([])

    const canvasRef1 = useRef<HTMLCanvasElement>(null);
    const canvasRef2 = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if(!!canvasRef1.current && !!canvasRef2.current && !!window.Chart && stats && chart && range) {
            const labels = [],
                users:number[] = [],
                properties:number[] = [],
                swapRequests:number[] = [],
                swaps:number[] = []
            let index = 0
            for(var i = range[0].getTime(); i <= range[1].getTime(); i += 24*3600*1000) {
                labels.push(new Date(i).toLocaleDateString())
                users.push(0)
                properties.push(0)
                swapRequests.push(0)
                swaps.push(0)
                stats.users.forEach(d => {
                    if(d.toDateString() === new Date(i).toDateString()) {
                        users[index] = users[index]+ 1
                    }
                })
                stats.properties.forEach(d => {
                    if(d.toDateString() === new Date(i).toDateString()) {
                        properties[index] = properties[index]+ 1
                    }
                })
                stats.swapRequests.forEach(d => {
                    if(d.toDateString() === new Date(i).toDateString()) {
                        swapRequests[index] = swapRequests[index]+ 1
                    }
                })
                stats.swaps.forEach(d => {
                    if(d.toDateString() === new Date(i).toDateString()) {
                        swaps[index] = swaps[index]+ 1
                    }
                })
                index++
            }

            chart[0].data.labels = labels
            chart[0].data.datasets = []
            chart[0].data.datasets.push({data: users, label: "New USERS", backgroundColor: colors[1]+"44", borderColor: colors[1], borderWidth: 1})
            chart[0].data.datasets.push({data: properties, label: 'New PROPERTIES', backgroundColor: colors[2]+"44", borderColor: colors[2], borderWidth: 1})
            chart[0].update();

            chart[1].data.labels = labels
            chart[1].data.datasets = []
            chart[1].data.datasets.push({data: swapRequests, label: 'New REQUESTS', backgroundColor: colors[3]+"44", borderColor: colors[3], borderWidth: 1})
            chart[1].data.datasets.push({data: swaps, label: 'New SWAPS', backgroundColor: colors[4]+"44", borderColor: colors[4], borderWidth: 1})
            chart[1].update();

            setStats({
                ...stats,
                usersForRange: users,
                propertiesForRange: properties,
                swapRequestsForRange: swapRequests,
                swapsForRange: swaps
            })
        }
    }, [range])

    const onLoad = () => {
        const ctx1 = canvasRef1.current?.getContext('2d')!;
        const ctx2 = canvasRef2.current?.getContext('2d')!;
        if(!ctx1 || !ctx2) return
        const cc1 = new window.Chart(ctx1, defaultChart);
        const cc2 = new window.Chart(ctx2, defaultChart);
        setChart([cc1, cc2])
    }

    useEffect(() => {
        if(!window.Chart) {
            var resource = document.createElement('script'); 
            resource.async = true
            resource.src = "https://cdn.jsdelivr.net/npm/chart.js";
            resource.onload = onLoad
            var script = document.getElementsByTagName('script')[0];
            document.head.insertBefore(resource, script);
        } else onLoad()

        Promise.all([
            admin.users.get({"fields": "createdAt,onboarding", "limit": "-1", "sort": "-createdAt"}) as unknown as Promise<Api.ApiResponse<{createdAt: string}[]>>,
            admin.properties.get({"fields": "createdAt", "limit": "-1", "sort": "-createdAt"}) as unknown as Promise<Api.ApiResponse<{createdAt: string}[]>>,
            admin.swapRequests.all({"fields": "createdAt", "limit": "-1", "sort": "-createdAt"}) as unknown as Promise<Api.ApiResponse<{createdAt: string}[]>>,
            admin.swaps.all({"fields": "createdAt", "limit": "-1", "sort": "-createdAt"}) as unknown as Promise<Api.ApiResponse<{createdAt: string}[]>>,
        ])
        .then(d => {
            setStats({
                users: d[0].data.map(d => new Date(d.createdAt)),
                properties: d[1].data.map(d => new Date(d.createdAt)),
                swapRequests: d[2].data.map(d => new Date(d.createdAt)),
                swaps: d[3].data.map(d => new Date(d.createdAt))
            })
        })
        .catch(e => {
            console.log(e)
        })
        .finally(() => {
            setLoading(false)
        })
    }, [])

    const nbNewUsersInRange = stats?.usersForRange?.reduce((acc, v) => acc + v, 0) || 0
    const nbNewPropertiesInRange = stats?.propertiesForRange?.reduce((acc, v) => acc + v, 0) || 0
    const nbNewSwapRequestsInRange = stats?.swapRequestsForRange?.reduce((acc, v) => acc + v, 0) || 0
    const nbNewSwapsInRange = stats?.swapsForRange?.reduce((acc, v) => acc + v, 0) || 0

    return (<div style={{padding: 5}}>
        {loading || !chart ?
            <ActivityIndicator color={variables.colors.black} size="large" />
        : <>
            <div style={{display: "flex", flexDirection: "row", justifyContent: "space-between"}}>
                <div style={{display: "flex", flexDirection: "column"}}>
                    <div>Users: {nbNewUsersInRange}/{stats?.users.length} (last {lastNbDays} days/TOTAL)</div>
                    <div>Properties: {nbNewPropertiesInRange}/{stats?.properties.length} (last {lastNbDays} days/TOTAL)</div>
                </div>
                <div style={{flexDirection:"row", display: "flex", alignItems: "center"}}>
                    Last X days:
                    <KNumberInput value={"14"} onChange={v => {
                        const n = parseInt(`${v}`)
                        if(isNaN(n)) return
                        setLastNbDays(n)
                        setRange([new Date(Date.now() - (n * 24 * 3600 * 1000)), new Date()])
                    }} min={0} max={365} style={{width: 100}} topStyle={{width: 200}} />
                </div>
            </div>
        </>}
        <canvas ref={canvasRef1} id="chart1" style={{
            width: "100%",
            height: 300
        }}></canvas>
        <div style={{display: "flex", flexDirection: "column"}}>
                    <div>Swap requests: {nbNewSwapRequestsInRange}/{stats?.swapRequests.length} (last {lastNbDays} days/TOTAL)</div>
                    <div>Swaps: {nbNewSwapsInRange}/{stats?.swaps.length} (last {lastNbDays} days/TOTAL)</div>
                </div>
        <canvas ref={canvasRef2} id="chart2" style={{
            width: "100%",
            height: 300
        }}></canvas>
    </div>)
}