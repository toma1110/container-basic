import { Construct } from 'constructs';
import { CfnOutput } from 'aws-cdk-lib';
import { CfnRouteTable, CfnRoute, CfnSubnetRouteTableAssociation } from 'aws-cdk-lib/aws-ec2';
import { BaseResource } from './abstract/base-resouce';
import { Subnet } from './subnet';
import { InternetGateway } from './internet-gateway';
import { Vpc } from './vpc';

interface RouteInfo {
    readonly id: string;
    readonly destinationCidrBlock: string;
    readonly gatewayId?: () => string;
    readonly natGatewayId?: () => string;
}

interface AssociationInfo {
    readonly id: string;
    readonly subnetId: () => string;
}

interface ResourceInfo {
    readonly id: string;
    readonly resourceName: string;
    readonly routes: RouteInfo[];
    readonly associations: AssociationInfo[];
    readonly assign: (routeTable: CfnRouteTable) => void;
}

export class RouteTable extends BaseResource {
    public readonly public: CfnRouteTable;
    public readonly container1a: CfnRouteTable;
    public readonly container1c: CfnRouteTable;
    public readonly db: CfnRouteTable;

    private readonly vpc: Vpc;
    private readonly subnet: Subnet;
    private readonly internetGateway: InternetGateway;
    private readonly resources: ResourceInfo[] = [
        {
            id: 'RouteTablePublic',
            resourceName: 'rtb-public',
            routes: [{
                id: 'RoutePublic',
                destinationCidrBlock: '0.0.0.0/0',
                gatewayId: () => this.internetGateway.igw.ref
            }],
            associations: [
                {
                    id: 'RouteTableAssociationPublic1a',
                    subnetId: () => this.subnet.public1a.ref
                },
                {
                    id: 'RouteTableAssociationPublic1c',
                    subnetId: () => this.subnet.public1c.ref
                },
                {
                    id: 'RouteTableAssociationMng1a',
                    subnetId: () => this.subnet.mng1a.ref
                },
                {
                    id: 'RouteTableAssociationMng1c',
                    subnetId: () => this.subnet.mng1c.ref
                }
            ],
            assign: routeTable => (this.public as CfnRouteTable) = routeTable
        },
        {
            id: 'RouteTablecontainer1a',
            resourceName: 'rtb-container1a',
            routes: [],
            associations: [
                {
                    id: 'RouteTableAssociationContainer1a',
                    subnetId: () => this.subnet.container1a.ref
                }
            ],
            assign: routeTable => (this.container1a as CfnRouteTable) = routeTable

        },
        {
            id: 'RouteTablecontainer1c',
            resourceName: 'rtb-container1c',
            routes: [],
            associations: [
                {
                    id: 'RouteTableAssociationContainer1c',
                    subnetId: () => this.subnet.container1c.ref
                }
            ],
            assign: routeTable => (this.container1c as CfnRouteTable) = routeTable
        },
        {
            id: 'RouteTableDb',
            resourceName: 'rtb-db',
            routes: [],
            associations: [
                {
                    id: 'RouteTableAssociationDb1a',
                    subnetId: () => this.subnet.db1a.ref
                },
                {
                    id: 'RouteTableAssociationDb1c',
                    subnetId: () => this.subnet.db1c.ref
                }
            ],
            assign: routeTable => (this.db as CfnRouteTable) = routeTable
        }
    ];

    constructor(
        scope: Construct,
        vpc: Vpc,
        subnet: Subnet,
        internetGateway: InternetGateway,
    ) {
        super();

        this.vpc = vpc;
        this.subnet = subnet;
        this.internetGateway = internetGateway;

        for (const resourceInfo of this.resources) {
            const routeTable = this.createRouteTable(scope, resourceInfo);
            resourceInfo.assign(routeTable);

            for (const routeInfo of resourceInfo.routes) {
                this.createRoute(scope, routeInfo, routeTable);
            }

            for (const associationInfo of resourceInfo.associations) {
                this.createAssociation(scope, associationInfo, routeTable);
            }
        }
    }

    private createRouteTable(scope: Construct, resourceInfo: ResourceInfo): CfnRouteTable {
        var resourceName = this.createResourceName(scope, resourceInfo.resourceName)
        const routeTable = new CfnRouteTable(scope, resourceInfo.id, {
            vpcId: this.vpc.vpc.ref,
            tags: [{
                key: 'Name',
                value: resourceName
            }]
        });

        new CfnOutput(scope, resourceName, {
            value: routeTable.attrRouteTableId,
            exportName: resourceName
        });
        return routeTable;
    }

    private createRoute(scope: Construct, routeInfo: RouteInfo, routeTable: CfnRouteTable) {
        const route = new CfnRoute(scope, routeInfo.id, {
            routeTableId: routeTable.ref,
            destinationCidrBlock: routeInfo.destinationCidrBlock
        });

        if (routeInfo.gatewayId) {
            route.gatewayId = routeInfo.gatewayId();
        } else if (routeInfo.natGatewayId) {
            route.natGatewayId = routeInfo.natGatewayId();
        }
    }

    private createAssociation(scope: Construct, associationInfo: AssociationInfo, routeTable: CfnRouteTable) {
        new CfnSubnetRouteTableAssociation(scope, associationInfo.id, {
            routeTableId: routeTable.ref,
            subnetId: associationInfo.subnetId()
        });
    }
}
