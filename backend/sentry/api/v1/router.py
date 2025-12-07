"""API v1 router."""

from ninja import Router

# Create a router for v1 endpoints
router_v1 = Router(tags=["v1"])

# Feature routers
# router_v1.add_router("example", example_router)   # Example feature router
