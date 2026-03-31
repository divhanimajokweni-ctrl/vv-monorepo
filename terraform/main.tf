module "safegrid_db" {
  source  = "terraform-aws-modules/rds/aws"
  version = "~> 6.0"

  identifier = "safegrid-brain-db"

  engine               = "postgres"
  engine_version       = "15.4"
  family               = "postgres15"
  major_engine_version = "15"
  instance_class       = "db.t4g.medium" # Graviton3 is cost-effective in Cape Town

  allocated_storage = 20
  db_name           = "safegrid_brain"
  username          = "vaguely_admin"
  port              = 5432

  # Africa (Cape Town) Availability Zones
  availability_zone = "af-south-1a"

  parameter_group_params = [
    {
      name  = "rds.logical_replication"
      value = "1"
    },
    {
      name  = "wal_level"
      value = "logical"
    }
  ]

  options = []

  # Ensure VPC alignment for Ubuntu Pools & SafeGrid
  vpc_security_group_ids = [aws_security_group.db_sg.id]
  subnet_ids             = module.vpc.private_subnets
}