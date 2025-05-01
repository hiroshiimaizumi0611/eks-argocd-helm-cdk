import { Construct } from 'constructs'
import {
  Cluster,
  NodegroupAmiType,
  KubernetesVersion,
  EndpointAccess,
  CapacityType,
} from 'aws-cdk-lib/aws-eks'
import { Role, ServicePrincipal, ManagedPolicy } from 'aws-cdk-lib/aws-iam'
import type { Vpc } from 'aws-cdk-lib/aws-ec2'
import { SubnetType, InstanceType } from 'aws-cdk-lib/aws-ec2'

// EKSクラスターとノードグループを作成するカスタムConstruct
export class EksConstruct extends Construct {
  public readonly cluster: Cluster // 他のConstruct（Helmインストール等）で参照できるようにする

  constructor(scope: Construct, id: string, vpc: Vpc) {
    super(scope, id)

    // EKSクラスターの作成
    this.cluster = new Cluster(this, 'EksCluster', {
      version: KubernetesVersion.V1_29, // EKSのバージョン
      vpc: vpc, // 先ほど作ったVPCを使う
      vpcSubnets: [{ subnetType: SubnetType.PRIVATE_WITH_EGRESS }], // ノードはPrivateサブネットにだけ作る
      defaultCapacity: 0, // デフォルトノード（capacity=2）を無効化
      endpointAccess: EndpointAccess.PUBLIC_AND_PRIVATE, // コントロールプレーンはPublic/Private両方アクセス可
    })

    // ワーカーノード用IAMロール作成
    const nodeRole = new Role(this, 'NodeInstanceRole', {
      assumedBy: new ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName('AmazonEKSWorkerNodePolicy'),
        ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonEC2ContainerRegistryReadOnly',
        ),
        ManagedPolicy.fromAwsManagedPolicyName('AmazonEKS_CNI_Policy'),
      ],
    })

    // NodeGroupを作成
    this.cluster.addNodegroupCapacity('DefaultNodeGroup', {
      nodegroupName: 'eks-private-nodes',
      desiredSize: 2, // デフォルト2台
      minSize: 1,
      maxSize: 3,
      instanceTypes: [new InstanceType('t3.medium')], // インスタンスタイプ
      subnets: { subnetType: SubnetType.PRIVATE_WITH_EGRESS }, // ノードはPrivateサブネットに配置
      amiType: NodegroupAmiType.AL2_X86_64, // Amazon Linux 2
      capacityType: CapacityType.ON_DEMAND, // オンデマンドインスタンス
      nodeRole: nodeRole, // 作成したIAMロールを適用
    })
  }
}
