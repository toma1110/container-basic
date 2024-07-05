import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CodeCommit } from '../resource/codecommit';

export class CodeComitStack extends Stack {
    public readonly codecommit: CodeCommit;

    constructor(
        scope: Construct,
        id: string,
        props?: StackProps
    ) {
        super(scope, id, props);

        // ECR
        this.codecommit = new CodeCommit(this);
    }
}
