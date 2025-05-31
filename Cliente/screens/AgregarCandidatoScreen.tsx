// Importaciones principales de React Native y librerías adicionales
import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Platform,
    Alert,
    FlatList,
    ImageBackground,
    ScrollView,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { supabase } from '../lib/supabase';

// Componente principal para asignar candidatos a elecciones
export default function AgregarCandidatoScreen() {
    // Estados para almacenar datos de la base de datos
    const [usuarios, setUsuarios] = useState<any[]>([]);
    const [elecciones, setElecciones] = useState<any[]>([]);
    const [candidaturas, setCandidaturas] = useState<any[]>([]);

    // Estados de selección del formulario
    const [selectedUser, setSelectedUser] = useState<string>('');
    const [selectedEleccion, setSelectedEleccion] = useState<string>('');
    const [propuesta, setPropuesta] = useState('');

    // Estados para manejar carga y envío
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Estado para edición de una candidatura existente
    const [editandoId, setEditandoId] = useState<number | null>(null);

    // Función para cargar datos de Supabase
    const cargarDatos = async () => {
        setLoading(true);

        const { data: users } = await supabase
            .from('users')
            .select('id, username, role')
            .eq('role', 'CANDIDATO');

        const { data: eleccions } = await supabase
            .from('eleccions')
            .select('id, nombre');

        const { data: candidaturasData } = await supabase
            .from('candidaturas')
            .select('id, propuesta, userid, eleccionid');

        setUsuarios(users || []);
        setElecciones(eleccions || []);
        setCandidaturas(candidaturasData || []);
        setLoading(false);
    };

    // useEffect que carga los datos al montar el componente
    useEffect(() => {
        cargarDatos();
    }, []);

    // Agregar o actualizar una candidatura
    const handleAgregarOActualizar = async () => {
        if (!selectedUser || !selectedEleccion || !propuesta.trim()) {
            Alert.alert('Todos los campos son obligatorios');
            return;
        }

        const userId = Number(selectedUser);
        const eleccionId = Number(selectedEleccion);

        if (isNaN(userId) || isNaN(eleccionId) || userId <= 0 || eleccionId <= 0) {
            Alert.alert('Selecciona un candidato y una elección válidos');
            return;
        }

        setSubmitting(true);

        if (editandoId) {
            // Actualiza una candidatura existente
            const { error } = await supabase
                .from('candidaturas')
                .update({ propuesta })
                .eq('id', editandoId);

            setSubmitting(false);

            if (error) {
                Alert.alert('Error', 'No se pudo actualizar la candidatura.');
            } else {
                Alert.alert('Éxito', 'Candidatura actualizada');
                limpiarFormulario();
                cargarDatos();
            }
        } else {
            // Verifica si ya existe una candidatura para el mismo usuario y elección
            const { data: existente } = await supabase
                .from('candidaturas')
                .select('id')
                .eq('userid', userId)
                .eq('eleccionid', eleccionId)
                .maybeSingle();

            if (existente) {
                setSubmitting(false);
                Alert.alert('Este candidato ya está asignado a esta elección');
                return;
            }

            // Inserta una nueva candidatura
            const dataToInsert = {
                propuesta,
                userid: userId,
                eleccionid: eleccionId,
            };

            const { error } = await supabase.from('candidaturas').insert([dataToInsert]);

            setSubmitting(false);

            if (error) {
                Alert.alert('Error', 'No se pudo registrar la candidatura. Intenta nuevamente.');
            } else {
                Alert.alert('Éxito', 'Candidato asignado a la elección');
                limpiarFormulario();
                cargarDatos();
            }
        }
    };

    // Cargar datos de una candidatura existente en el formulario para editar
    const iniciarEdicion = (item: any) => {
        setEditandoId(item.id);
        setSelectedUser(item.userid.toString());
        setSelectedEleccion(item.eleccionid.toString());
        setPropuesta(item.propuesta);
    };

    // Limpia el formulario y cancela el modo de edición
    const limpiarFormulario = () => {
        setEditandoId(null);
        setPropuesta('');
        setSelectedUser('');
        setSelectedEleccion('');
    };

    // Elimina una candidatura por su ID
    const handleEliminar = async (id: number) => {
        if (Platform.OS === 'web') {
            if (window.confirm('¿Estás seguro de que deseas eliminar esta candidatura?')) {
                const { error } = await supabase.from('candidaturas').delete().eq('id', id);
                if (!error) {
                    Alert.alert('Eliminado', 'Candidatura eliminada correctamente.');
                    cargarDatos();
                }
            }
        } else {
            Alert.alert(
                'Eliminar candidatura',
                '¿Estás seguro de que deseas eliminar esta candidatura?',
                [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                        text: 'Eliminar',
                        style: 'destructive',
                        onPress: async () => {
                            const { error } = await supabase.from('candidaturas').delete().eq('id', id);
                            if (!error) {
                                Alert.alert('Eliminado', 'Candidatura eliminada correctamente.');
                                cargarDatos();
                            } else {
                                Alert.alert('Error', 'No se pudo eliminar la candidatura.');
                            }
                        },
                    },
                ]
            );
        }
    };

    // Muestra un indicador de carga mientras se obtienen los datos
    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#0d6efd" />
            </View>
        );
    }

    // Render del componente principal
    return (
        <ImageBackground
            source={require('../assets/fondo.png')}
            style={styles.bg}
            resizeMode="cover"
        >
            <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                <View style={styles.container}>
                    <Text style={styles.title}>
                        {editandoId ? 'Editar Candidatura' : 'Asignar Candidato a Elección'}
                    </Text>

                    {/* Formulario de asignación */}
                    <View style={styles.formCard}>
                        <Text style={styles.label}>Selecciona un candidato:</Text>
                        <View style={styles.pickerContainer}>
                            <Picker
                                selectedValue={selectedUser}
                                onValueChange={setSelectedUser}
                                style={styles.picker}
                                enabled={!editandoId}
                            >
                                <Picker.Item label="Selecciona un candidato" value="" />
                                {usuarios.map((user: any) => (
                                    <Picker.Item key={user.id} label={user.username} value={user.id.toString()} />
                                ))}
                            </Picker>
                        </View>

                        <Text style={styles.label}>Selecciona una elección:</Text>
                        <View style={styles.pickerContainer}>
                            <Picker
                                selectedValue={selectedEleccion}
                                onValueChange={setSelectedEleccion}
                                style={styles.picker}
                                enabled={!editandoId}
                            >
                                <Picker.Item label="Selecciona una elección" value="" />
                                {elecciones.map((eleccion: any) => (
                                    <Picker.Item key={eleccion.id} label={eleccion.nombre} value={eleccion.id.toString()} />
                                ))}
                            </Picker>
                        </View>

                        <Text style={styles.label}>Propuesta del candidato:</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Escribe la propuesta"
                            value={propuesta}
                            onChangeText={setPropuesta}
                            multiline
                        />

                        {/* Botones de acción */}
                        <View style={{ flexDirection: 'row', marginTop: 8 }}>
                            <TouchableOpacity
                                style={[
                                    styles.btnAgregar,
                                    { backgroundColor: editandoId ? '#198754' : '#0d6efd' },
                                ]}
                                onPress={handleAgregarOActualizar}
                                disabled={submitting}
                            >
                                {editandoId ? (
                                    <MaterialIcons name="check" size={20} color="#fff" />
                                ) : (
                                    <Ionicons name="person-add-outline" size={20} color="#fff" />
                                )}
                                <Text style={styles.btnAgregarText}>
                                    {submitting
