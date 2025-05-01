import * as cdk from 'aws-cdk-lib'
import type { Construct } from 'constructs'
import { VpcConstruct } from './constructs/vpc'
import { EksConstruct } from './constructs/eks'

export class EksArgocdHelmCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    const { vpc } = new VpcConstruct(this, 'vpc')
    const { cluster } = new EksConstruct(this, 'eks', vpc)
  }
}
