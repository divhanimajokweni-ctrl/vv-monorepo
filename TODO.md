# BayWater Services VVU Monorepo Adaptation TODO

## Completed Tasks ✅

### High Priority
- **Adapt packages/mainframe for water metrics collection (acoustic logger + smart meter data)**  
  Updated triad-collector.ts and metric-emitter.ts for water metrics

- **Update packages/safestakes escrow for 15% community profit share distribution to QCOs**  
  Added BayWater trust escrow with automatic QCO distributions

- **Modify LindiweSpineHealth.tsx dashboard for water infrastructure monitoring (8 layers mapped to water integrity)**  
  Renamed to Water Spine Health with water-specific integrity layers

- **Configure shadow-evaluator tools for municipal bill vs internal meter data comparison**  
  Added --compare mode for bill tampering detection

- **Generate first QCO underwriting event for pilot deployment**  
  Updated generate-first-event.ts with QCO parameters

- **Configure deployment scripts for water-staging environment**  
  Modified deploy-and-test.sh with water-staging mode

## Pending Tasks ⏳

### Medium Priority
- **Adapt underwriting scripts for QCO social reliability underwriting instead of credit scores**  
  Update underwriting logic to focus on community reliability metrics

- **Modify staging tests for water scenarios (savings dividends, QCO reporting, meter key rotation)**  
  Create water-specific test suites for synthetic breach testing

### Low Priority  
- **Update Terraform modules for water infrastructure deployment with ZA data residency**  
  Configure infrastructure-as-code for South African data residency

- **Adapt GODMOD.md chat interface to 'Water Assistant' for offline QCO support**  
  Create offline-capable LLM interface for QCO assistance

## Progress Summary
- **Completed**: 6/10 tasks (60%)
- **High Priority**: 6/6 completed (100%)
- **Medium Priority**: 0/2 completed (0%)
- **Low Priority**: 0/2 completed (0%)

Ready for initial BayWater pilot deployment with core functionality implemented.