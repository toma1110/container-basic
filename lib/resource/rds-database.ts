import { CfnOutput } from "aws-cdk-lib";
import { CfnDBCluster, CfnDBInstance } from "aws-cdk-lib/aws-rds";
import { Construct } from "constructs";
import { BaseResource } from "./abstract/base-resouce";
import { RdsParameterGroup } from "./rds-parameter-group";
import { RdsSubnetGroup } from "./rds-subnet-group";
import { Role } from "./role";
import { OSecretKey, Secret } from "./secretmanager_master";
import { SecurityGroup } from "./security-group";

interface InstanceInfo {
    readonly id: string;
    readonly availabilityZone: string;
    readonly preferredMaintenanceWindow: string;
    readonly resourceName: string;
}

export class RdsDatabase extends BaseResource {
    private static readonly engine = 'aurora-mysql';
    private static readonly databaseName = 'sbcntrapp';
    private static readonly dbInstanceClass = 'db.t3.small';
    private readonly instances: InstanceInfo[] = [
        {
            id: 'RdsDbInstance1a',
            availabilityZone: 'ap-northeast-1a',
            preferredMaintenanceWindow: 'sun:20:00-sun:20:30',
            resourceName: 'rds-instance-1a'
        },
        // {
        //     id: 'RdsDbInstance1c',
        //     availabilityZone: 'ap-northeast-1c',
        //     preferredMaintenanceWindow: 'sun:20:30-sun:21:00',
        //     resourceName: 'rds-instance-1c'
        // }
    ];

    constructor(
        scope: Construct,
        subnetGroup: RdsSubnetGroup,
        parameterGroup: RdsParameterGroup,
        secret: Secret,
        securityGroup: SecurityGroup,
        role: Role
    ) {
        super();

        // DB Cluster
        const cluster = new CfnDBCluster(scope, 'RdsDbCluster', {
            engine: RdsDatabase.engine,
            backupRetentionPeriod: 7,
            databaseName: RdsDatabase.databaseName,
            dbClusterIdentifier: this.createResourceName(scope, 'rds-cluster'),
            dbClusterParameterGroupName: parameterGroup.cluster.ref,
            dbSubnetGroupName: subnetGroup.subnetGroup.ref,
            enableCloudwatchLogsExports: ['error'],
            engineMode: 'provisioned',
            engineVersion: '5.7.mysql_aurora.2.11.4',
            masterUserPassword: Secret.getDynamicReference(secret.rdsCluster, OSecretKey.MasterUserPassword),
            masterUsername: Secret.getDynamicReference(secret.rdsCluster, OSecretKey.MasterUsername),
            port: 3306,
            preferredBackupWindow: '19:00-19:30',
            preferredMaintenanceWindow: 'sun:19:30-sun:20:00',
            storageEncrypted: true,
            vpcSecurityGroupIds: [securityGroup.rds.attrGroupId]
        });

        new CfnOutput(scope, 'RdsDbClusterArnOutput', {
            value: cluster.attrEndpointAddress,
            exportName: this.createResourceName(scope, "dbcluster") + "-arn",
        });

        // DB Instance
        for (const instanceInfo of this.instances) {
            const instance = this.createInstance(scope, instanceInfo, cluster, subnetGroup, parameterGroup, role);
        }


    }

    private createInstance(
        scope: Construct,
        instanceInfo: InstanceInfo,
        cluster: CfnDBCluster,
        subnetGroup: RdsSubnetGroup,
        parameterGroup: RdsParameterGroup,
        role: Role
    ): CfnDBInstance {
        const instance = new CfnDBInstance(scope, instanceInfo.id, {
            dbInstanceClass: RdsDatabase.dbInstanceClass,
            autoMinorVersionUpgrade: false,
            availabilityZone: instanceInfo.availabilityZone,
            dbClusterIdentifier: cluster.ref,
            dbInstanceIdentifier: this.createResourceName(scope, instanceInfo.resourceName),
            dbParameterGroupName: parameterGroup.instance.ref,
            dbSubnetGroupName: subnetGroup.subnetGroup.ref,
            enablePerformanceInsights: false,
            engine: RdsDatabase.engine,
            monitoringInterval: 60,
            monitoringRoleArn: role.rds.attrArn,
            // performanceInsightsRetentionPeriod: 7,
            preferredMaintenanceWindow: instanceInfo.preferredMaintenanceWindow,
        });

        return instance;
    }

}
