import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
// import { CodeCommit } from '../resource/codecommit';
import { CodeBuild } from '../resource/codebuild';
import { CodePipeline } from '../resource/codepipeline';

export class CICDStack extends Stack {
    // public readonly codecommit: CodeCommit;
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
        // const build = codepipeline.addBuildStage();

    }
}
