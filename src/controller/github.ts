import axios, { Axios, AxiosError, AxiosResponse } from "axios";

export default async function getBodyData(url: string): Promise<string> {
    const data = await axios.get(url);
    return await data.data;
}
