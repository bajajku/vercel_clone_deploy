import {createClient, commandOptions} from 'redis';
import { getConstantValue } from 'typescript';
import { downloadS3Folder } from './aws';
import { buildProject } from './utils';

const subscriber = createClient();
subscriber.connect(); // will connect to local redis


async function main() {

    // created an infinite loop to listen for new deployments
    while(1){

        const response = await subscriber.brPop(
            commandOptions({isolated: true}),
            "deployments",
            0
        );
        if(response === null){
            throw new Error("response is null");
        }
        const id = response.element;
        console.log(response);

        await downloadS3Folder(`output/${id}`);
        await buildProject(id);
    }
}
main();