import axios from "axios";

const GetApiRequest = (url, textFailedToLoad, onSuccess, onFailure) => {
    axios.get(url)
        .then(response => {
            if (response.status === 200) {
                onSuccess(response.data);
            } else {
                onFailure('Failed to load ' + textFailedToLoad);
            }
        })
        .catch(error => {
            onFailure('Failed to load ' + textFailedToLoad + ': ' + error);
        });
}

export default GetApiRequest;