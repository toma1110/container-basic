import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { SecretsManager } from '../resource/secretsmanager_dbuser';


export class SecretsManagerDBUserStack extends Stack {
    public readonly secret: SecretsManager;

    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        // Secret DBUser
        this.secret = new SecretsManager(this, 'SecretsManagerDBUser');

    }
}
