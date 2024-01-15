import { CfnRepository } from 'aws-cdk-lib/aws-ecr';
import { Construct } from "constructs";
import { BaseResource } from "./abstract/base-resouce";

interface ResourceInfo {
    readonly id: string;
    readonly encryptionConfiguration: {
        encryptionType: string,

        // the properties below are optional
        // kmsKey: string,
    },
    readonly imageScanningConfiguration: {
        scanOnPush: boolean,
    },
    readonly imageTagMutability: string,
    // lifecyclePolicy: {
    //     lifecyclePolicyText: string,
    //     registryId: string,
    // },
    readonly repositoryName: string,
    // readonly repositoryPolicyText: string,
    readonly tags: [{
        key: 'key',
        value: 'value',
    }],
    readonly resourceName: string;
    readonly assign: (ecr: CfnRepository) => void;
};


export class Ecr extends BaseResource {
    public readonly frontend: CfnRepository;
    public readonly backend: CfnRepository;


    private readonly resources: ResourceInfo[] = [
        {
            id: 'frontend',
            encryptionConfiguration: {
                encryptionType: 'AES256',

                // the properties below are optional
                // kmsKey: '',
            },
            imageScanningConfiguration: {
                scanOnPush: true,
            },
            imageTagMutability: 'MUTABLE',
            // lifecyclePolicy: {
            //     lifecyclePolicyText: 'lifecyclePolicyText',
            //     registryId: 'registryId',
            // },
            repositoryName: '',
            // repositoryPolicyText: repositoryPolicyText,
            tags: [{
                key: 'key',
                value: 'value',
            }],
            resourceName: 'frontend',
            assign: repo => (this.frontend as CfnRepository) = repo
        },
        {
            id: 'backend',
            encryptionConfiguration: {
                encryptionType: 'AES256',

                // the properties below are optional
                // kmsKey: '',
            },
            imageScanningConfiguration: {
                scanOnPush: true,
            },
            imageTagMutability: 'MUTABLE',
            // lifecyclePolicy: {
            //     lifecyclePolicyText: 'lifecyclePolicyText',
            //     registryId: 'registryId',
            // },
            repositoryName: '',
            // repositoryPolicyText: repositoryPolicyText,
            tags: [{
                key: 'key',
                value: 'value',
            }],
            resourceName: 'backend',
            assign: repo => (this.backend as CfnRepository) = repo
        },
    ];

    constructor(scope: Construct) {
        super();

        for (const resourceInfo of this.resources) {
            const ecr = this.createEcr(scope, resourceInfo);
            resourceInfo.assign(ecr);
        }
    }

    private createEcr(scope: Construct, resourceInfo: ResourceInfo): CfnRepository {
        const resourceName = this.createResourceName(scope, resourceInfo.resourceName);
        const ecr = new CfnRepository(scope, resourceInfo.id, {
            encryptionConfiguration: {
                encryptionType: resourceInfo.encryptionConfiguration.encryptionType,

                // the properties below are optional
                // kmsKey: resourceInfo.encryptionConfiguration.kmsKey,
            },
            imageScanningConfiguration: {
                scanOnPush: resourceInfo.imageScanningConfiguration.scanOnPush,
            },
            imageTagMutability: resourceInfo.imageTagMutability,
            // lifecyclePolicy: {
            //     lifecyclePolicyText: 'lifecyclePolicyText',
            //     registryId: 'registryId',
            // },
            repositoryName: resourceName,
            // repositoryPolicyText: repositoryPolicyText,
            tags: [{
                key: 'key',
                value: 'value',
            }],


        })
        return ecr
    }

}
