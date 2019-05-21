resource "aws_cloudwatch_event_rule" "schedule" {
  name                = "every-five-minutes"
  description         = "Fires every 15 minutes"
  schedule_expression = "rate(15 minutes)"
}

resource "aws_cloudwatch_event_target" "check_parity_sync_trigger" {
  rule      = "${aws_cloudwatch_event_rule.schedule.name}"
  target_id = "check_foo"
  arn       = "${aws_lambda_function.check_parity_sync.arn}"
}

resource "aws_lambda_permission" "allow_cloudwatch_to_call_check_parity" {
  statement_id  = "AllowExecutionFromCloudWatch"
  action        = "lambda:InvokeFunction"
  function_name = "${aws_lambda_function.check_parity_sync.function_name}"
  principal     = "events.amazonaws.com"
  source_arn    = "${aws_cloudwatch_event_rule.schedule.arn}"
}

resource "aws_lambda_function" "check_parity_sync" {
  filename = "check-parity.zip"
  runtime  = "nodejs8.10"

  environment {
    variables = {
      "HEALTHCHECK_URL" = "${aws_instance.ethereum.public_dns}"
    }
  }

  function_name = "checkParitySync"
  role          = "${aws_iam_role.iam_for_lambda.arn}"
  handler       = "index.handler"
}

resource "aws_iam_policy" "lambda_logging" {
  name        = "lambda_logging"
  path        = "/"
  description = "IAM policy for logging from a lambda"

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*",
      "Effect": "Allow"
    }
  ]
}
EOF
}

resource "aws_iam_role" "iam_for_lambda" {
  name = "iam_for_lambda"

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF
}

resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = "${aws_iam_role.iam_for_lambda.name}"
  policy_arn = "${aws_iam_policy.lambda_logging.arn}"
}
