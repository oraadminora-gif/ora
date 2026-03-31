# api/views/cn/messages.py
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404

from core.models import ContactMessage
from api.permissions import IsCN


def _serialize(m):
    return {
        'id':         m.id,
        'name':       m.name,
        'email':      m.email,
        'phone':      m.phone,
        'subject':    m.subject,
        'subject_label': m.get_subject_display(),
        'message':    m.message,
        'is_read':    m.is_read,
        'created_at': m.created_at,
    }


class CNMessagesView(APIView):
    """GET /cn/messages/ — liste des messages de contact."""
    permission_classes = [IsAuthenticated, IsCN]

    def get(self, request):
        qs = ContactMessage.objects.order_by('is_read', '-created_at')

        subject = request.query_params.get('subject')
        if subject:
            qs = qs.filter(subject=subject)

        is_read = request.query_params.get('is_read')
        if is_read == 'false':
            qs = qs.filter(is_read=False)
        elif is_read == 'true':
            qs = qs.filter(is_read=True)

        unread_count = ContactMessage.objects.filter(is_read=False).count()

        return Response({
            'messages':     [_serialize(m) for m in qs],
            'unread_count': unread_count,
        })


class CNMessageDetailView(APIView):
    """PATCH /cn/messages/{id}/ — marquer lu/non-lu."""
    permission_classes = [IsAuthenticated, IsCN]

    def patch(self, request, pk):
        msg = get_object_or_404(ContactMessage, pk=pk)
        if 'is_read' in request.data:
            msg.is_read = bool(request.data['is_read'])
            msg.save(update_fields=['is_read'])
        return Response(_serialize(msg))

    def delete(self, request, pk):
        msg = get_object_or_404(ContactMessage, pk=pk)
        msg.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
