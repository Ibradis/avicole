from apps.common.tenant_context import set_current_organisation

class TenantMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.user.is_authenticated:
            set_current_organisation(request.user.organisation)
        else:
            set_current_organisation(None)
        
        response = self.get_response(request)
        return response
