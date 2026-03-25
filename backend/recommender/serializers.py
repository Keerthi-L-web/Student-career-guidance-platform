from rest_framework import serializers


class StudentProfileSerializer(serializers.Serializer):
    favoriteSubjects = serializers.ListField(
        child=serializers.CharField(),
        allow_empty=True,
        default=list,
    )
    interestAreas = serializers.DictField(
        child=serializers.IntegerField(min_value=1, max_value=5),
        default=dict,
    )
    skills = serializers.DictField(
        child=serializers.IntegerField(min_value=1, max_value=5),
        default=dict,
    )
    preferredWorkEnvironment = serializers.CharField(default="Office/Tech")
    careerGoals = serializers.ListField(
        child=serializers.CharField(),
        allow_empty=True,
        required=False,
        default=list,
    )
