import { Construct } from 'constructs'
import * as cdk from 'aws-cdk-lib'
import { Vpc, SubnetType } from 'aws-cdk-lib/aws-ec2'

export class VpcConstruct extends Construct {
  public readonly vpc: Vpc

  constructor(scope: Construct, id: string) {
    super(scope, id)

    this.vpc = new Vpc(this, 'EksVpc', {
      cidr: '10.0.0.0/16',
      maxAzs: 2,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'PublicSubnet',
          subnetType: SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'PrivateSubnet',
          subnetType: SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
      natGateways: 1,
    })

    // PublicサブネットにIngress用タグを付与
    for (const subnet of this.vpc.publicSubnets) {
      cdk.Tags.of(subnet).add('kubernetes.io/role/elb', '1')
    }

    // PrivateサブネットにInternal-ELB用タグを付与
    for (const subnet of this.vpc.privateSubnets) {
      cdk.Tags.of(subnet).add('kubernetes.io/role/internal-elb', '1')
    }
  }
}
