import * as cdk from 'aws-cdk-lib/core';
import * as codecommit from 'aws-cdk-lib/aws-codecommit';
import { Construct } from 'constructs';
import { BaseResource } from "./abstract/base-resouce";


export class CodeCommit extends BaseResource {
    constructor(scope: Construct, props?: cdk.StackProps) {
        super();

        const sbcntrBackendRepository = new codecommit.Repository(scope, 'sbcntrBackendRepository', {
            repositoryName: 'sbcntr-backend',
            description: 'Repository for sbcntr backend application'
        });


        new cdk.CfnOutput(scope, 'sbcntrBackendRepositoryArn', {
            value: sbcntrBackendRepository.repositoryArn,
            exportName: 'sbcntr--backend-repository-arn',
        });


    }
}