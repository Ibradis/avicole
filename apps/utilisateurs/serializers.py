from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from apps.common.serializer_mixins import AvicoleValidationMixin

Utilisateur = get_user_model()

class UtilisateurReadSerializer(AvicoleValidationMixin, serializers.ModelSerializer):
    class Meta:
        model = Utilisateur
        fields = ['id', 'email', 'first_name', 'last_name', 'role', 'telephone', 'organisation', 'entite_type', 'entite_id', 'is_active', 'doit_changer_mdp', 'date_joined']

class UtilisateurWriteSerializer(AvicoleValidationMixin, serializers.ModelSerializer):
    class Meta:
        model = Utilisateur
        fields = ['email', 'first_name', 'last_name', 'role', 'telephone', 'entite_type', 'entite_id', 'password']
        extra_kwargs = {
            'password': {'write_only': True, 'required': False}
        }

    def validate(self, attrs):
        role = attrs.get('role', getattr(self.instance, 'role', 'controleur'))
        entite_type = attrs.get('entite_type', getattr(self.instance, 'entite_type', None))
        entite_id = attrs.get('entite_id', getattr(self.instance, 'entite_id', None))

        if role in ('admin', 'pdg'):
            attrs['entite_type'] = None
            attrs['entite_id'] = None
        elif role == 'controleur' and (entite_type != 'ferme' or not entite_id):
            raise serializers.ValidationError("Un contrôleur doit être rattaché à une ferme via entite_type='ferme' et entite_id.")
        elif role in ('gerant', 'vendeur') and (entite_type != 'boutique' or not entite_id):
            raise serializers.ValidationError("Un gérant ou vendeur doit être rattaché à une boutique via entite_type='boutique' et entite_id.")

        return attrs

    def validate_password(self, value):
        validate_password(value)
        return value

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        if not password:
            password = "1234"
            validated_data['doit_changer_mdp'] = True
        
        user = super().create(validated_data)
        user.set_password(password)
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        if password:
            validated_data['doit_changer_mdp'] = False
        
        user = super().update(instance, validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user

class PasswordResetSerializer(serializers.Serializer):
    email = serializers.EmailField()

class InviteUserSerializer(serializers.Serializer):
    email = serializers.EmailField()
    role = serializers.ChoiceField(choices=Utilisateur.ROLE_CHOICES)
    entite_type = serializers.ChoiceField(choices=(('ferme', 'Ferme'), ('boutique', 'Boutique')), required=False, allow_null=True)
    entite_id = serializers.IntegerField(required=False, allow_null=True)

    def validate(self, attrs):
        role = attrs.get('role')
        entite_type = attrs.get('entite_type')
        entite_id = attrs.get('entite_id')

        if role in ('admin', 'pdg'):
            attrs['entite_type'] = None
            attrs['entite_id'] = None
        elif role == 'controleur' and (entite_type != 'ferme' or not entite_id):
            raise serializers.ValidationError("Un contrôleur doit être rattaché à une ferme.")
        elif role in ('gerant', 'vendeur') and (entite_type != 'boutique' or not entite_id):
            raise serializers.ValidationError("Un gérant ou vendeur doit être rattaché à une boutique.")

        return attrs

class ActivateAccountSerializer(serializers.Serializer):
    token = serializers.CharField()
    password = serializers.CharField(write_only=True)

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
