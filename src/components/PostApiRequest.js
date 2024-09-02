import axios from "axios";

const PostApiRequest = (url, data, textFailedToPost, onSuccess, onFailure) => {
    axios.post(url, data)
        .then(response => {
            if (response.status === 200) {
                onSuccess(response.data);
            } else {
                onFailure('Failed to post ' + textFailedToPost);
            }
        })
        .catch(error => {
            onFailure('Failed to post ' + textFailedToPost + ': ' + error);
        });
}

export default PostApiRequest;