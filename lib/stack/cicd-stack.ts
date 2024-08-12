import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CodeBuild } from '../resource/codebuild';
import { CodePipeline } from '../resource/codepipeline';

export class CICDStack extends Stack {
    public readonly codebuild: CodeBuild;

    constructor(
        scope: Construct,
        id: string,
        props?: StackProps
    ) {
        super(scope, id, props);

        // CodeBuild
        this.codebuild = new CodeBuild(this);

        // CodePipeline
        const codepipeline = new CodePipeline(this);

    }
}
