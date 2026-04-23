from django.db import models
from .tenant_context import get_current_organisation

class TenantManager(models.Manager):
    def get_queryset(self):
        org = get_current_organisation()
        if org:
            return super().get_queryset().filter(organisation=org)
        return super().get_queryset()

class TenantModel(models.Model):
    # This abstract model can be used as a base
    objects = TenantManager()
    
    class Meta:
        abstract = True
