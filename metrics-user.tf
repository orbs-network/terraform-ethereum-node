resource "aws_iam_user" "cloudwatch" {
  name = "cloudwatch-reporter-${var.application}"
  path = "/system/"

  tags = {
    tag-key = "cloudwatch-reporter-${var.application}"
  }
}

resource "aws_iam_access_key" "cloudwatch" {
  user = aws_iam_user.cloudwatch.name
}

resource "aws_iam_user_policy" "cloudwatch_role" {
  name = "cloudwatch-reporter-policy"
  user = aws_iam_user.cloudwatch.name

  policy = <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "cloudwatch:PutMetricData",
                "ec2:DescribeTags",
                "logs:PutLogEvents",
                "logs:DescribeLogStreams",
                "logs:DescribeLogGroups",
                "logs:CreateLogStream",
                "logs:CreateLogGroup"
            ],
            "Resource": "*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "ssm:GetParameter"
            ],
            "Resource": "arn:aws:ssm:*:*:parameter/AmazonCloudWatch-*"
        }
    ]
}
EOF
}
