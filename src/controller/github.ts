import axios, { Axios, AxiosError, AxiosResponse } from "axios";

function getBodyData(url: string) {
    axios
        .get(url)
        .then((res: AxiosResponse) => {
            const bodyText = res.data;
            return bodyText;
        })
        .catch((err: AxiosError) => {
            console.log(err);
        });
}
