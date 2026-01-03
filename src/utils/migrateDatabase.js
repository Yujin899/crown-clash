/**
 * Database Migration Utility
 * Migrates from flat collection structure to subcollection structure
 * 
 * OLD STRUCTURE:
 * - subjects/ (top-level)
 * - quizzes/ (top-level, has subjectId)
 * - questions/ (top-level, has quizId)
 * 
 * NEW STRUCTURE:
 * - subjects/{id}/quizzes/{id}/questions/{id}
 */

import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc,
  writeBatch 
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

export const migrateToSubcollections = async () => {
  console.log('🚀 Starting database migration...');
  
  try {
    // Step 1: Get all subjects
    console.log('📚 Fetching subjects...');
    const subjectsSnap = await getDocs(collection(db, 'subjects'));
    const subjects = subjectsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    console.log(`Found ${subjects.length} subjects`);

    // Step 2: Get all quizzes
    console.log('📝 Fetching quizzes...');
    const quizzesSnap = await getDocs(collection(db, 'quizzes'));
    const quizzes = quizzesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    console.log(`Found ${quizzes.length} quizzes`);

    // Step 3: Get all questions
    console.log('❓ Fetching questions...');
    const questionsSnap = await getDocs(collection(db, 'questions'));
    const questions = questionsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    console.log(`Found ${questions.length} questions`);

    // Step 4: Migrate data
    for (const subject of subjects) {
      console.log(`\n📌 Processing subject: ${subject.name}`);
      
      // Find quizzes for this subject
      const subjectQuizzes = quizzes.filter(q => q.subjectId === subject.id);
      console.log(`  Found ${subjectQuizzes.length} quizzes`);

      for (const quiz of subjectQuizzes) {
        console.log(`  📝 Migrating quiz: ${quiz.title}`);
        
        // Create quiz in subcollection
        const quizRef = doc(db, `subjects/${subject.id}/quizzes/${quiz.id}`);
        const quizData = { ...quiz };
        delete quizData.id;
        delete quizData.subjectId; // No longer needed
        
        await setDoc(quizRef, quizData);

        // Find questions for this quiz
        const quizQuestions = questions.filter(q => q.quizId === quiz.id);
        console.log(`    Found ${quizQuestions.length} questions`);

        for (const question of quizQuestions) {
          // Create question in subcollection
          const questionRef = doc(db, `subjects/${subject.id}/quizzes/${quiz.id}/questions/${question.id}`);
          const questionData = { ...question };
          delete questionData.id;
          delete questionData.quizId; // No longer needed
          
          await setDoc(questionRef, questionData);
        }
      }
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('\n⚠️ IMPORTANT: Old collections (quizzes, questions) are still present.');
    console.log('   Run deleteOldCollections() after verifying the migration.');
    
    return { success: true, subjects: subjects.length };

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

/**
 * Delete old top-level collections after migration
 * WARNING: This is irreversible! Only run after verifying migration.
 */
export const deleteOldCollections = async () => {
  console.log('⚠️ WARNING: This will delete old collections!');
  console.log('Only proceed if you have verified the migration.');
  
  const confirmed = window.confirm(
    'Are you sure you want to delete the old quizzes and questions collections? This cannot be undone!'
  );
  
  if (!confirmed) {
    console.log('Deletion cancelled.');
    return;
  }

  try {
    console.log('🗑️ Deleting old quizzes collection...');
    const quizzesSnap = await getDocs(collection(db, 'quizzes'));
    const batch = writeBatch(db);
    
    quizzesSnap.docs.forEach(docSnapshot => {
      batch.delete(docSnapshot.ref);
    });
    
    await batch.commit();
    console.log('✅ Deleted quizzes collection');

    console.log('🗑️ Deleting old questions collection...');
    const questionsSnap = await getDocs(collection(db, 'questions'));
    const batch2 = writeBatch(db);
    
    questionsSnap.docs.forEach(docSnapshot => {
      batch2.delete(docSnapshot.ref);
    });
    
    await batch2.commit();
    console.log('✅ Deleted questions collection');

    console.log('\n✅ Cleanup completed!');
    
  } catch (error) {
    console.error('❌ Deletion failed:', error);
    throw error;
  }
};

/**
 * Verify migration by counting documents
 */
export const verifyMigration = async () => {
  console.log('🔍 Verifying migration...\n');
  
  try {
    const subjectsSnap = await getDocs(collection(db, 'subjects'));
    console.log(`Subjects: ${subjectsSnap.size}`);
    
    let totalQuizzes = 0;
    let totalQuestions = 0;
    
    for (const subjectDoc of subjectsSnap.docs) {
      const quizzesSnap = await getDocs(collection(db, `subjects/${subjectDoc.id}/quizzes`));
      totalQuizzes += quizzesSnap.size;
      
      for (const quizDoc of quizzesSnap.docs) {
        const questionsSnap = await getDocs(collection(db, `subjects/${subjectDoc.id}/quizzes/${quizDoc.id}/questions`));
        totalQuestions += questionsSnap.size;
      }
    }
    
    console.log(`Total Quizzes (in subcollections): ${totalQuizzes}`);
    console.log(`Total Questions (in subcollections): ${totalQuestions}`);
    
    // Compare with old collections
    const oldQuizzesSnap = await getDocs(collection(db, 'quizzes'));
    const oldQuestionsSnap = await getDocs(collection(db, 'questions'));
    
    console.log(`\nOld quizzes collection: ${oldQuizzesSnap.size}`);
    console.log(`Old questions collection: ${oldQuestionsSnap.size}`);
    
    const quizzesMatch = totalQuizzes === oldQuizzesSnap.size;
    const questionsMatch = totalQuestions === oldQuestionsSnap.size;
    
    if (quizzesMatch && questionsMatch) {
      console.log('\n✅ Migration verified! All data migrated successfully.');
      return true;
    } else {
      console.log('\n⚠️ Warning: Document counts do not match!');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
    return false;
  }
};

// Export function to run migration from console
if (typeof window !== 'undefined') {
  window.migrateDatabase = migrateToSubcollections;
  window.verifyMigration = verifyMigration;
  window.deleteOldCollections = deleteOldCollections;
  
  console.log('Migration utils loaded. Available commands:');
  console.log('  window.migrateDatabase() - Run migration');
  console.log('  window.verifyMigration() - Verify migration');
  console.log('  window.deleteOldCollections() - Delete old collections');
}
