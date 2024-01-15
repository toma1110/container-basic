import { App } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { VpcStack } from '../../lib/stack/vpc-stack';

test('Vpc Stack', () => {
    const app = new App({
        context: {
            'systemName': 'sbcntr',
            'envType': 'stg'
        }
    });
    const vpcStack = new VpcStack(app, 'VpcStack');
    const template = Template.fromStack(vpcStack);

    // VPC
    template.resourceCountIs('AWS::EC2::VPC', 1);
    template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        Tags: [{ Key: 'Name', Value: 'sbcntr-stg-vpc' }]
    });

    // Subnet
    template.resourceCountIs('AWS::EC2::Subnet', 10);
    template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.0.0/24',
        VpcId: Match.anyValue(),
        AvailabilityZone: 'ap-northeast-1a',
        Tags: [{ Key: 'Name', Value: 'sbcntr-stg-subnet-public-1a' }]
    });
    template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.1.0/24',
        VpcId: Match.anyValue(),
        AvailabilityZone: 'ap-northeast-1c',
        Tags: [{ Key: 'Name', Value: 'sbcntr-stg-subnet-public-1c' }]
    });
    template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.8.0/24',
        VpcId: Match.anyValue(),
        AvailabilityZone: 'ap-northeast-1a',
        Tags: [{ Key: 'Name', Value: 'sbcntr-stg-subnet-app-1a' }]
    });
    template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.9.0/24',
        VpcId: Match.anyValue(),
        AvailabilityZone: 'ap-northeast-1c',
        Tags: [{ Key: 'Name', Value: 'sbcntr-stg-subnet-app-1c' }]
    });
    template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.16.0/24',
        VpcId: Match.anyValue(),
        AvailabilityZone: 'ap-northeast-1a',
        Tags: [{ Key: 'Name', Value: 'sbcntr-stg-subnet-db-1a' }]
    });
    template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.17.0/24',
        VpcId: Match.anyValue(),
        AvailabilityZone: 'ap-northeast-1c',
        Tags: [{ Key: 'Name', Value: 'sbcntr-stg-subnet-db-1c' }]
    });
    template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.240.0/24',
        VpcId: Match.anyValue(),
        AvailabilityZone: 'ap-northeast-1a',
        Tags: [{ Key: 'Name', Value: 'sbcntr-stg-subnet-mng-1a' }]
    });
    template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.241.0/24',
        VpcId: Match.anyValue(),
        AvailabilityZone: 'ap-northeast-1c',
        Tags: [{ Key: 'Name', Value: 'sbcntr-stg-subnet-mng-1c' }]
    });
    template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.248.0/24',
        VpcId: Match.anyValue(),
        AvailabilityZone: 'ap-northeast-1a',
        Tags: [{ Key: 'Name', Value: 'sbcntr-stg-subnet-egress-1a' }]
    });
    template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.249.0/24',
        VpcId: Match.anyValue(),
        AvailabilityZone: 'ap-northeast-1c',
        Tags: [{ Key: 'Name', Value: 'sbcntr-stg-subnet-egress-1c' }]
    });

    // Internet Gateway
    template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    template.hasResourceProperties('AWS::EC2::InternetGateway', {
        Tags: [{ Key: 'Name', Value: 'sbcntr-stg-igw' }]
    });
    template.resourceCountIs('AWS::EC2::VPCGatewayAttachment', 1);
    template.hasResourceProperties('AWS::EC2::VPCGatewayAttachment', {
        VpcId: Match.anyValue(),
        InternetGatewayId: Match.anyValue()
    });

    // // Elastic IP
    // template.resourceCountIs('AWS::EC2::EIP', 2);
    // template.hasResourceProperties('AWS::EC2::EIP', {
    //     Domain: 'vpc',
    //     Tags: [{ Key: 'Name', Value: 'sbcntr-stg-eip-ngw-1a' }]
    // });
    // template.hasResourceProperties('AWS::EC2::EIP', {
    //     Domain: 'vpc',
    //     Tags: [{ Key: 'Name', Value: 'sbcntr-stg-eip-ngw-1c' }]
    // });

    // Route Table
    template.resourceCountIs('AWS::EC2::RouteTable', 2);
    template.hasResourceProperties('AWS::EC2::RouteTable', {
        VpcId: Match.anyValue(),
        Tags: [{ Key: 'Name', Value: 'sbcntr-stg-rtb-public' }]
    });
    template.hasResourceProperties('AWS::EC2::RouteTable', {
        VpcId: Match.anyValue(),
        Tags: [{ Key: 'Name', Value: 'sbcntr-stg-rtb-db' }]
    });
    template.resourceCountIs('AWS::EC2::Route', 1);
    template.hasResourceProperties('AWS::EC2::Route', {
        RouteTableId: Match.anyValue(),
        DestinationCidrBlock: '0.0.0.0/0',
        GatewayId: Match.anyValue()
    });
    template.resourceCountIs('AWS::EC2::SubnetRouteTableAssociation', 6);
    template.hasResourceProperties('AWS::EC2::SubnetRouteTableAssociation', {
        RouteTableId: Match.anyValue(),
        SubnetId: Match.anyValue()
    });

});
