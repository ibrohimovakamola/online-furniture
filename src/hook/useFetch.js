import React, { useEffect, useState } from 'react'

const useFetch = (path) => {
    const [state, setState] = useState(null)
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)
    useEffect(()=>{
        async function fetchData() {
            setLoading(true);
            try{
                const res = await fetch(`https://dummyjson.com/${path}`)
                const data = await res.json()
                setState(data)

            } catch(error){
                setError(error)
            } finally{
                setLoading(false)
            }
        }
        if(path) fetchData()
    }, [path])

    return {state, error, loading}
}

export default useFetch